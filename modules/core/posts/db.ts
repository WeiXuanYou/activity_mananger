/**
 * Phase C — DB-backed queries for posts.
 *
 * `Post.likes` and `Post.comments` are derived counts from the polymorphic
 * Reaction / Comment tables. We compute them in a follow-up `groupBy`
 * query rather than denormalising on the Post row, so reactions and
 * comments can be CRUD'd without touching the Post itself.
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import { prismaCategoryToCategory } from "@/modules/core/categories";
import { visiblePostsWhere } from "@/modules/core/visibility";
import type { Post, PostKind } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type CategoryRow = {
  id: string; slug: string; name: string; emoji: string; color: string;
  isDefault: boolean; createdById: string | null; description: string | null;
};

type PostRow = {
  id: string;
  authorId: string;
  author: UserWithRole;
  kind: string;
  title: string | null;
  body: string;
  isPinned: boolean;
  pinnedById: string | null;
  hiddenAt: Date | null;
  bonus: string | null;
  createdAt: Date;
  categories: { category: CategoryRow }[];
};

/** Best-effort relative time. Phase C+ swap for a proper i18n formatter. */
function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-TW");
}

export function prismaPostToPost(
  row: PostRow,
  counts?: { likes?: number; comments?: number },
): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    author: prismaUserToMember(row.author),
    kind: row.kind as PostKind,
    title: row.title ?? undefined,
    body: row.body,
    likes: counts?.likes ?? 0,
    comments: counts?.comments ?? 0,
    createdAt: row.isPinned ? "置頂中" : relativeTime(row.createdAt),
    isPinned: row.isPinned,
    pinnedById: row.pinnedById ?? undefined,
    categoryIds: row.categories.map((c) => c.category.id),
    categories: row.categories.map((c) => prismaCategoryToCategory(c.category)),
    hiddenAt: row.hiddenAt ? row.hiddenAt.toISOString() : null,
    bonus: row.bonus,
  };
}

const POST_INCLUDE = {
  author: { include: { role: { select: { name: true } } } },
  categories: { include: { category: true } },
} as const;

/** Fetch posts and enrich with like / comment counts via two side queries. */
async function loadPostsWithCounts(rows: PostRow[]): Promise<Post[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [reactions, comments] = await Promise.all([
    db.reaction.groupBy({
      by: ["parentId"],
      where: { parentType: "POST", parentId: { in: ids } },
      _count: { _all: true },
    }),
    db.comment.groupBy({
      by: ["parentId"],
      where: { parentType: "POST", parentId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const likeCount = new Map(reactions.map((r) => [r.parentId, r._count._all]));
  const commentCount = new Map(comments.map((c) => [c.parentId, c._count._all]));

  return rows.map((r) =>
    prismaPostToPost(r, {
      likes: likeCount.get(r.id) ?? 0,
      comments: commentCount.get(r.id) ?? 0,
    }),
  );
}

export async function listPostsDb(): Promise<Post[]> {
  const rows = await db.post.findMany({
    where: visiblePostsWhere(),
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: POST_INCLUDE,
  });
  return loadPostsWithCounts(rows);
}

export async function listPinnedPostsDb(): Promise<Post[]> {
  const rows = await db.post.findMany({
    where: { ...visiblePostsWhere(), isPinned: true },
    orderBy: { createdAt: "desc" },
    include: POST_INCLUDE,
  });
  return loadPostsWithCounts(rows);
}

export async function listUnpinnedPostsDb(): Promise<Post[]> {
  const rows = await db.post.findMany({
    where: { ...visiblePostsWhere(), isPinned: false },
    orderBy: { createdAt: "desc" },
    include: POST_INCLUDE,
  });
  return loadPostsWithCounts(rows);
}

export async function findPostDb(id: string): Promise<Post | null> {
  const row = await db.post.findUnique({ where: { id }, include: POST_INCLUDE });
  if (!row) return null;
  const enriched = await loadPostsWithCounts([row]);
  return enriched[0] ?? null;
}

export async function filterPostsByCategorySlugDb(slug: string): Promise<Post[]> {
  const cat = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (!cat) return [];
  const rows = await db.post.findMany({
    where: { categories: { some: { categoryId: cat.id } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: POST_INCLUDE,
  });
  return loadPostsWithCounts(rows);
}

/**
 * For a given user + post id list, return the set of post ids they've liked.
 * Used by feed pages to render the heart in the "filled" state.
 */
export async function findLikedPostIdsByUserDb(
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const rows = await db.reaction.findMany({
    where: {
      userId,
      parentType: "POST",
      parentId: { in: postIds },
      kind: "LIKE",
    },
    select: { parentId: true },
  });
  return new Set(rows.map((r) => r.parentId));
}
