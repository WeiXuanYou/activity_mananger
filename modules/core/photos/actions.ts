"use server";
/**
 * Photo-wall edit: remove a single photo from wherever it lives.
 *
 * The wall is a read-model over posts / comments / pages, so "deleting a
 * photo" means surgically removing that one image URL from its source:
 *   - post   → drop the matching entry from the `images` JSON array
 *   - comment → null out `image` (a comment has at most one)
 *   - page   → drop it from a photo-album block's `photos`, or clear an
 *              image block's url
 *
 * Authorization: the photo's owner (post author / comment author / page
 * owner) OR a moderator. We re-resolve ownership server-side from the
 * source row — never trust the client's claim.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";

export type RemovePhotoInput = {
  source: "post" | "comment" | "page";
  sourceId: string;
  /** The full (original) image URL to remove — matched against the source. */
  refUrl: string;
};

export async function removeWallPhotoAction(input: RemovePhotoInput): Promise<{ error?: string }> {
  const me = await requireCurrentUser();

  if (input.source === "post") {
    const post = await db.post.findUnique({
      where: { id: input.sourceId },
      select: { authorId: true, images: true },
    });
    if (!post) return {};
    const isOwner = post.authorId === me.id;
    if (!isOwner && !(await canCurrentUser("post.moderate"))) {
      return { error: "只能移除自己的照片" };
    }
    let arr: { url: string; thumbUrl?: string }[] = [];
    try { arr = JSON.parse(post.images ?? "[]"); } catch { arr = []; }
    const next = arr.filter((x) => x?.url !== input.refUrl);
    await db.post.update({
      where: { id: input.sourceId },
      data: { images: next.length ? JSON.stringify(next) : null },
    });
    revalidatePath("/app/photos");
    revalidatePath(`/app/posts/${input.sourceId}`);
    revalidatePath("/app/feed");
    return {};
  }

  if (input.source === "comment") {
    const c = await db.comment.findUnique({
      where: { id: input.sourceId },
      select: { authorId: true, body: true, image: true, parentId: true },
    });
    if (!c) return {};
    const isOwner = c.authorId === me.id;
    if (!isOwner && !(await canCurrentUser("comment.moderate"))) {
      return { error: "只能移除自己的照片" };
    }
    // If the comment is image-only (no text), removing the image would
    // leave an empty comment — delete the whole comment instead.
    if (!c.body.trim()) {
      await db.comment.delete({ where: { id: input.sourceId } });
    } else {
      await db.comment.update({ where: { id: input.sourceId }, data: { image: null } });
    }
    revalidatePath("/app/photos");
    revalidatePath(`/app/posts/${c.parentId}`);
    return {};
  }

  // page
  const page = await db.customPage.findUnique({
    where: { id: input.sourceId },
    select: { ownerId: true, slug: true, blocks: { select: { id: true, type: true, data: true } } },
  });
  if (!page) return {};
  const isOwner = page.ownerId === me.id;
  if (!isOwner && !(await canCurrentUser("page.publish"))) {
    return { error: "只能移除自己頁面的照片" };
  }
  // Find the block holding this url and rewrite it.
  for (const b of page.blocks) {
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(b.data); } catch { continue; }
    if (b.type === "photo-album" && Array.isArray(data.photos)) {
      const photos = data.photos as { url?: string }[];
      if (photos.some((p) => p?.url === input.refUrl)) {
        const next = photos.filter((p) => p?.url !== input.refUrl);
        await db.customPageBlock.update({
          where: { id: b.id },
          data: { data: JSON.stringify({ ...data, photos: next }) },
        });
        break;
      }
    } else if (b.type === "image" && data.url === input.refUrl) {
      await db.customPageBlock.update({
        where: { id: b.id },
        data: { data: JSON.stringify({ ...data, url: "" }) },
      });
      break;
    }
  }
  revalidatePath("/app/photos");
  revalidatePath(`/app/pages/${page.slug}`);
  return {};
}
