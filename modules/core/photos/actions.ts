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
import { deleteUploadFiles } from "@/modules/uploads/paths";

export type RemovePhotoInput = {
  source: "post" | "comment" | "page" | "album";
  sourceId: string;
  /** The full (original) image URL to remove — matched against the source. */
  refUrl: string;
};

/**
 * Add one or more photos DIRECTLY to the shared album wall (not via a
 * post). Gated on `post.create` — same trust level as posting content, so
 * Guests can't flood the shared album. `images` are already-uploaded
 * { url, thumbUrl } pairs from uploadImageAction.
 */
export async function addAlbumPhotosAction(input: {
  images: { url: string; thumbUrl?: string; caption?: string }[];
}): Promise<{ error?: string; added?: number }> {
  const me = await requireCurrentUser();
  if (!(await canCurrentUser("post.create"))) {
    return { error: "你目前沒有上傳到相簿的權限" };
  }
  const rows = (input.images ?? [])
    .filter((i) => i && typeof i.url === "string" && i.url.startsWith("/uploads/"))
    .slice(0, 30) // sane cap per submit
    .map((i) => ({
      uploaderId: me.id,
      url: i.url,
      thumbUrl: typeof i.thumbUrl === "string" ? i.thumbUrl : null,
      caption: typeof i.caption === "string" && i.caption.trim() ? i.caption.trim().slice(0, 200) : null,
    }));
  if (rows.length === 0) return { error: "沒有可加入的照片" };
  await db.albumPhoto.createMany({ data: rows });
  revalidatePath("/app/photos");
  return { added: rows.length };
}

export async function removeWallPhotoAction(input: RemovePhotoInput): Promise<{ error?: string }> {
  const me = await requireCurrentUser();

  // Album photos: uploaded directly to the wall. Owner or moderator.
  if (input.source === "album") {
    const photo = await db.albumPhoto.findUnique({
      where: { id: input.sourceId },
      select: { uploaderId: true, url: true, thumbUrl: true },
    });
    if (!photo) return {};
    const isOwner = photo.uploaderId === me.id;
    if (!isOwner && !(await canCurrentUser("post.moderate"))) {
      return { error: "只能移除自己的照片" };
    }
    await db.albumPhoto.delete({ where: { id: input.sourceId } });
    // Album photos are uploaded then can be deleted freely by the owner, so
    // this is the path most likely to accumulate orphaned files on the
    // (possibly small) uploads disk. Best-effort unlink the backing files.
    await deleteUploadFiles([photo.url, photo.thumbUrl]);
    revalidatePath("/app/photos");
    return {};
  }

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
    // leave an empty comment — delete the whole comment instead (and clear
    // any reactions on it, which are polymorphic with no FK cascade).
    if (!c.body.trim()) {
      await db.$transaction([
        db.reaction.deleteMany({ where: { parentType: "COMMENT", parentId: input.sourceId } }),
        db.comment.delete({ where: { id: input.sourceId } }),
      ]);
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
