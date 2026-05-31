"use server";
/**
 * Comment server actions. Creating a comment requires `comment.create`
 * (Member+). Deleting is owner-only (or comment.moderate for Editors).
 *
 * Notifies the content owner asynchronously when someone comments on
 * their stuff (skip if you're commenting on your own).
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { notify } from "@/modules/notifications";
import type { CommentParentType } from "./types";

export type CommentState = { error?: string };

export async function createCommentAction(input: {
  parentType: CommentParentType;
  parentId: string;
  body: string;
  image?: string | null;
  parentCommentId?: string;
}): Promise<CommentState> {
  await requirePermission("comment.create");
  const me = await requireCurrentUser();

  const body = input.body.trim();
  const image = input.image?.trim() || null;
  // A comment needs SOMETHING — text or an image.
  if (!body && !image) return { error: "請寫點東西或附上圖片" };
  if (body.length > 2000) return { error: "留言太長了（上限 2000 字）" };

  await db.comment.create({
    data: {
      authorId: me.id,
      parentType: input.parentType,
      parentId: input.parentId,
      body,
      image,
      parentCommentId: input.parentCommentId ?? null,
    },
  });

  // Notify the content owner. Best-effort lookup per parentType.
  void (async () => {
    let ownerId: string | null = null;
    let title = "有人留言了";
    let link = "/app/feed";
    try {
      if (input.parentType === "ACTIVITY") {
        const a = await db.activity.findUnique({
          where: { id: input.parentId },
          select: { authorId: true, title: true },
        });
        if (a) { ownerId = a.authorId; title = `「${a.title}」有新留言`; link = `/app/activity/${input.parentId}`; }
      } else if (input.parentType === "POST") {
        const p = await db.post.findUnique({
          where: { id: input.parentId },
          select: { authorId: true, title: true },
        });
        if (p) { ownerId = p.authorId; title = `「${p.title ?? "你的文章"}」有新留言`; link = "/app/feed"; }
      } else if (input.parentType === "PAGE") {
        const pg = await db.customPage.findUnique({
          where: { id: input.parentId },
          select: { ownerId: true, title: true, slug: true },
        });
        if (pg) { ownerId = pg.ownerId; title = `「${pg.title}」有新留言`; link = `/app/pages/${pg.slug}`; }
      }
      if (ownerId && ownerId !== me.id) {
        await notify({
          userId: ownerId,
          kind: "activity.rsvp", // reusing the social-event kind
          title,
          body: `${me.name}：${body ? `${body.slice(0, 60)}${body.length > 60 ? "..." : ""}` : "🖼 傳了一張圖片"}`,
          link,
        });
      }
    } catch {
      // Notification failure must never break commenting
    }
  })();

  // Revalidate paths that show this comment
  if (input.parentType === "ACTIVITY") revalidatePath(`/app/activity/${input.parentId}`);
  if (input.parentType === "POST") revalidatePath("/app/feed");
  if (input.parentType === "PAGE") {
    const pg = await db.customPage.findUnique({ where: { id: input.parentId }, select: { slug: true } });
    if (pg) revalidatePath(`/app/pages/${pg.slug}`);
  }

  return {};
}

/** Delete a comment. Authors can delete their own; Editors can moderate.
 *  Replies (anything with parentCommentId === this id) are deleted too —
 *  otherwise they'd dangle orphaned. We hand-cascade because the FK
 *  on Comment.parentCommentId is SetNull, not Cascade. */
export async function deleteCommentAction(commentId: string): Promise<void> {
  const me = await requireCurrentUser();
  const c = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, parentType: true, parentId: true },
  });
  if (!c) return;

  if (c.authorId !== me.id) {
    await requirePermission("comment.moderate");
  }
  await db.$transaction([
    db.comment.deleteMany({ where: { parentCommentId: commentId } }),
    db.comment.delete({ where: { id: commentId } }),
  ]);

  if (c.parentType === "ACTIVITY") revalidatePath(`/app/activity/${c.parentId}`);
  if (c.parentType === "POST") revalidatePath("/app/feed");
}

/** Edit a comment's body. Authors only — no moderator override (editing
 *  someone else's words is more aggressive than deleting them; if it's
 *  bad enough to need a mod, delete-then-explain is the better workflow). */
export async function editCommentAction(input: {
  id: string;
  body: string;
  /** undefined = leave image as-is; null = remove; string = set/replace. */
  image?: string | null;
}): Promise<CommentState> {
  const me = await requireCurrentUser();
  const c = await db.comment.findUnique({
    where: { id: input.id },
    select: { id: true, authorId: true, parentType: true, parentId: true, image: true },
  });
  if (!c) return { error: "找不到這則留言" };
  if (c.authorId !== me.id) return { error: "只能編輯自己的留言" };

  const body = input.body.trim();
  const nextImage = input.image === undefined ? c.image : (input.image?.trim() || null);
  if (!body && !nextImage) return { error: "請寫點東西或附上圖片" };
  if (body.length > 2000) return { error: "留言太長了（上限 2000 字）" };

  await db.comment.update({
    where: { id: input.id },
    data: { body, image: nextImage },
  });

  if (c.parentType === "ACTIVITY") revalidatePath(`/app/activity/${c.parentId}`);
  if (c.parentType === "POST") revalidatePath("/app/feed");
  if (c.parentType === "PAGE") {
    const pg = await db.customPage.findUnique({ where: { id: c.parentId }, select: { slug: true } });
    if (pg) revalidatePath(`/app/pages/${pg.slug}`);
  }
  return {};
}
