"use server";
/**
 * Server actions for posts. All mutations gated by `requirePermission`.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { emit } from "@/modules/analytics";
import type { PostKind } from "./types";

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
  const categorySlugs = formData.getAll("category").map(String).filter(Boolean);

  if (!body) return { error: "請寫點內容" };
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
      isPinned,
      pinnedById: isPinned ? me.id : null,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  emit("post.created", { type: "post", id: created.id }, { kind, isPinned }, me.id);

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
    emit("post.viewed", { type: "post", id: postId }, { reaction: "LIKE" }, me.id);
  }
  revalidatePath("/app/feed");
}
