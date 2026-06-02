"use server";
/**
 * Server actions for posts. All mutations gated by `requirePermission`.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission, canCurrentUser } from "@/modules/permissions";
import { emit } from "@/modules/analytics";
import type { PostKind, BonusKind, PostImage } from "./types";
import { BONUS_KINDS, MAX_POST_IMAGES, parsePostImages } from "./types";

/** Normalise a raw images value (FormData JSON or a passed array) into a
 *  capped, validated PostImage[] ready for storage. Thin wrapper over the
 *  shared parser with the per-post cap applied. */
const normalizePostImages = (raw: unknown) => parsePostImages(raw, MAX_POST_IMAGES);

export type CreatePostState = { error?: string; createdId?: string };

/**
 * Create a new post and redirect to the feed.
 * Used by `<form action={createPostFormAction}>` in the create page.
 */
export async function createPostFormAction(
  _prev: CreatePostState | undefined,
  formData: FormData,
): Promise<CreatePostState> {
  // Gate first — fail loudly before reading inputs
  await requirePermission("post.create");
  const me = await requireCurrentUser();

  const kind = String(formData.get("kind") ?? "ARTICLE") as PostKind;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isPinned = formData.get("pin") === "on";
  const allowCollab = formData.get("allowCollab") === "on";
  const images = normalizePostImages(formData.get("images"));
  const categorySlugs = formData.getAll("category").map(String).filter(Boolean);
  // Bonus is opt-in via a checkbox. When the toggle's off we ignore the
  // companion fields. `bonus` (description) is the required one;
  // `bonusKind` and `bonusLimit` are presentation hints.
  const bonusOn = formData.get("bonusOn") === "on";
  const bonusRaw = String(formData.get("bonus") ?? "").trim();
  const bonus = bonusOn && bonusRaw ? bonusRaw.slice(0, 200) : null;
  // Kind: validate against the known set; treat anything else as "no
  // structured hint" (legacy + safety).
  const kindRaw = String(formData.get("bonusKind") ?? "");
  const bonusKind: BonusKind | null =
    bonusOn && (kindRaw in BONUS_KINDS) ? (kindRaw as BonusKind) : null;
  // Limit: 1..999 if a positive integer was sent, else null.
  const limitRaw = String(formData.get("bonusLimit") ?? "").trim();
  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
  const bonusLimit =
    bonusOn && Number.isFinite(limitParsed) && limitParsed >= 1 && limitParsed <= 999
      ? limitParsed
      : null;

  if (!body) return { error: "請寫點內容" };
  if (bonusOn && !bonusRaw) return { error: "勾了「加入獎勵」但沒寫獎勵內容" };
  if (isPinned) {
    // Pinning is a separate permission — Editor+ only
    await requirePermission("post.pin");
  }

  const categoryIds: string[] = [];
  if (categorySlugs.length) {
    const cats = await db.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true },
    });
    categoryIds.push(...cats.map((c) => c.id));
  }

  const created = await db.post.create({
    data: {
      authorId: me.id,
      kind,
      title: title || null,
      body,
      bonus,
      bonusKind,
      bonusLimit,
      images: images.length ? JSON.stringify(images) : null,
      allowCollab,
      isPinned,
      pinnedById: isPinned ? me.id : null,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  void emit("post.created", { type: "post", id: created.id }, { kind, isPinned }, me.id);

  // Notify anyone @mentioned in the title/body. Fire-and-forget.
  void (async () => {
    const { notifyMentions } = await import("@/modules/mentions/notify");
    await notifyMentions({
      text: `${title}\n${body}`,
      authorId: me.id,
      authorName: me.name,
      title: "有人在貼文中提到你",
      link: "/app/feed",
    }).catch(() => {});
  })();

  revalidatePath("/app/feed");
  // Redirect throws under the hood — must not be inside try/catch
  redirect("/app/feed");
}

/** Pin / unpin an existing post (Editor+). */
export async function setPostPinnedAction(postId: string, pinned: boolean) {
  await requirePermission("post.pin");
  const me = await requireCurrentUser();

  await db.post.update({
    where: { id: postId },
    data: { isPinned: pinned, pinnedById: pinned ? me.id : null },
  });

  revalidatePath("/app/feed");
}

/**
 * Throws if `me` is neither the author nor a holder of `moderatePerm`.
 * Used by the update/delete actions below — author can always edit own,
 * Editor+ can moderate others'.
 */
async function ensureOwnerOrModerator(meId: string, authorId: string, moderatePerm: "post.moderate" | "activity.moderate" | "poll.moderate"): Promise<void> {
  if (authorId === meId) return;
  await requirePermission(moderatePerm);
}

/**
 * Update one of your own posts (or anyone's, if you have post.moderate).
 * Only the fields passed in get touched — undefined is no-op so the same
 * action serves "edit title" and "toggle pin" calls.
 */
export async function updatePostAction(input: {
  id: string;
  title?: string | null;
  body?: string;
  kind?: PostKind;
  isPinned?: boolean;
  categorySlugs?: string[];
  images?: PostImage[];
  allowCollab?: boolean;
}): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.post.findUnique({
    where: { id: input.id },
    select: { authorId: true, isPinned: true, allowCollab: true },
  });
  if (!existing) throw new Error("找不到文章");
  // Author + moderators can always edit. When the author opted into
  // collaboration, any signed-in member may edit the CONTENT too — but
  // toggling allowCollab itself, plus delete/hide, stay owner-or-moderator.
  if (existing.authorId !== me.id && !existing.allowCollab) {
    await requirePermission("post.moderate");
  }
  const isOwnerOrMod =
    existing.authorId === me.id || (await canCurrentUser("post.moderate"));

  // Pinning is a privileged action even for the owner — only post.pin holders
  // can change pin state.
  if (input.isPinned !== undefined && input.isPinned !== existing.isPinned) {
    await requirePermission("post.pin");
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title?.trim() || null;
  if (input.body !== undefined) data.body = input.body.trim();
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;
  if (input.images !== undefined) {
    const imgs = normalizePostImages(input.images);
    data.images = imgs.length ? JSON.stringify(imgs) : null;
  }
  // Only the owner / a moderator may flip the collaboration switch — a
  // collaborator editing the body can't open the door wider (or shut it).
  if (input.allowCollab !== undefined && isOwnerOrMod) {
    data.allowCollab = input.allowCollab;
  }

  // Categories — only touch the join table if explicitly provided
  if (input.categorySlugs) {
    const cats = await db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true },
    });
    await db.$transaction([
      db.postCategory.deleteMany({ where: { postId: input.id } }),
      db.postCategory.createMany({
        data: cats.map((c) => ({ postId: input.id, categoryId: c.id })),
      }),
    ]);
  }

  if (Object.keys(data).length) {
    await db.post.update({ where: { id: input.id }, data });
  }
  revalidatePath("/app/feed");
}

/**
 * Delete a post. Author can always delete own; post.moderate needed
 * to delete others'. Comments + Reactions live in polymorphic tables
 * (no FK cascade from Post), so they're swept up explicitly in the
 * same transaction.
 */
export async function deletePostAction(id: string): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId, "post.moderate");
  // Reactions ON the post's comments are polymorphic (parentType:"COMMENT")
  // and don't get swept by the POST-scoped deletes — gather the comment ids
  // first so we can clear their reactions too, or they'd orphan.
  const commentIds = (
    await db.comment.findMany({ where: { parentType: "POST", parentId: id }, select: { id: true } })
  ).map((c) => c.id);
  await db.$transaction([
    db.reaction.deleteMany({ where: { parentType: "COMMENT", parentId: { in: commentIds } } }),
    db.comment.deleteMany({ where: { parentType: "POST", parentId: id } }),
    db.reaction.deleteMany({ where: { parentType: "POST", parentId: id } }),
    db.post.delete({ where: { id } }),
  ]);
  revalidatePath("/app/feed");
}

/**
 * Toggle a 'LIKE' reaction on a post for the current user.
 * Idempotent: pressing it twice removes the like.
 */
export async function toggleLikeAction(postId: string) {
  const me = await requireCurrentUser();
  const existing = await db.reaction.findUnique({
    where: {
      userId_parentType_parentId_kind: {
        userId: me.id,
        parentType: "POST",
        parentId: postId,
        kind: "LIKE",
      },
    },
  });
  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else {
    await db.reaction.create({
      data: { userId: me.id, parentType: "POST", parentId: postId, kind: "LIKE" },
    });
    void emit("post.viewed", { type: "post", id: postId }, { reaction: "LIKE" }, me.id);
  }
  revalidatePath("/app/feed");
}

/**
 * Hide / un-hide a post. Same gate as edit/delete (owner OR
 * post.moderate). Hidden posts are filtered from list queries but the
 * detail surfaces stay intact for direct links.
 */
export async function setPostHiddenAction(id: string, hidden: boolean): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId, "post.moderate");
  await db.post.update({ where: { id }, data: { hiddenAt: hidden ? new Date() : null } });
  revalidatePath("/app/feed");
}
