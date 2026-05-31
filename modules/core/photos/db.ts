/**
 * Photo wall — aggregates every image across the app into one reverse-chron
 * gallery. Pure read model; owns no data. Sources:
 *   - Post.images   (JSON array of { url, thumbUrl })
 *   - Comment.image (single url)
 *   - CustomPageBlock photo-album blocks (data.photos[].url) + image blocks
 *
 * Each photo carries a back-link to where it came from so tapping a tile
 * jumps to the post / page / activity it lives on.
 */
import { db } from "@/lib/db";

export type WallPhoto = {
  /** Display URL (thumbnail when available). */
  url: string;
  /** Full-size URL for the lightbox. */
  fullUrl: string;
  /** Where it came from, for the caption + link. */
  source: "post" | "comment" | "page";
  /** In-app link to open the source. */
  href: string;
  /** Author / context label. */
  label: string;
  /** Sort key — ISO timestamp. */
  createdAt: string;
};

type RawPhoto = WallPhoto;

/** Best-effort parse of a Post.images JSON column. */
function parsePostImages(raw: string | null): { url: string; thumbUrl?: string }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.url === "string") : [];
  } catch {
    return [];
  }
}

/** Only count real uploaded files, not gradient placeholders. */
function isRealImage(url: string): boolean {
  return Boolean(url) && !url.startsWith("linear-gradient") && !url.startsWith("#");
}

export async function listWallPhotosDb(limit = 200): Promise<WallPhoto[]> {
  const [posts, comments, pages] = await Promise.all([
    db.post.findMany({
      where: { hiddenAt: null, images: { not: null } },
      select: { id: true, title: true, images: true, createdAt: true, author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    db.comment.findMany({
      where: { image: { not: null }, parentType: "POST" },
      select: { id: true, image: true, parentId: true, createdAt: true, author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    db.customPage.findMany({
      select: {
        slug: true, title: true, updatedAt: true,
        blocks: { select: { type: true, data: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  const photos: RawPhoto[] = [];

  for (const p of posts) {
    for (const img of parsePostImages(p.images)) {
      if (!isRealImage(img.url)) continue;
      photos.push({
        url: img.thumbUrl ?? img.url,
        fullUrl: img.url,
        source: "post",
        href: `/app/posts/${p.id}`,
        label: `${p.author.name}${p.title ? ` · ${p.title}` : ""}`,
        createdAt: p.createdAt.toISOString(),
      });
    }
  }

  for (const c of comments) {
    if (!c.image || !isRealImage(c.image)) continue;
    photos.push({
      url: c.image,
      fullUrl: c.image,
      source: "comment",
      href: `/app/posts/${c.parentId}`,
      label: `${c.author.name} 的留言`,
      createdAt: c.createdAt.toISOString(),
    });
  }

  for (const pg of pages) {
    for (const b of pg.blocks) {
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(b.data) as Record<string, unknown>; } catch { continue; }
      if (b.type === "photo-album" && Array.isArray(data.photos)) {
        for (const ph of data.photos as { url?: string; thumbUrl?: string }[]) {
          if (!ph?.url || !isRealImage(ph.url)) continue;
          photos.push({
            url: ph.thumbUrl ?? ph.url,
            fullUrl: ph.url,
            source: "page",
            href: `/app/pages/${pg.slug}`,
            label: `頁面 · ${pg.title}`,
            createdAt: pg.updatedAt.toISOString(),
          });
        }
      } else if (b.type === "image" && typeof data.url === "string" && isRealImage(data.url)) {
        photos.push({
          url: data.url,
          fullUrl: data.url,
          source: "page",
          href: `/app/pages/${pg.slug}`,
          label: `頁面 · ${pg.title}`,
          createdAt: pg.updatedAt.toISOString(),
        });
      }
    }
  }

  photos.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return photos.slice(0, limit);
}
