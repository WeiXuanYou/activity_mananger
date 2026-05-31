/**
 * Phase H — DB-backed comment queries.
 *
 * Uses the polymorphic Comment table (parentType + parentId), so the same
 * adapter serves posts, activities, custom pages, and threaded replies
 * without any per-content-type schema work.
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import type { Comment, CommentParentType } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type CommentRow = {
  id: string;
  authorId: string;
  author: UserWithRole;
  parentType: string;
  parentId: string;
  body: string;
  image: string | null;
  parentCommentId: string | null;
  createdAt: Date;
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-TW");
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    authorId: row.authorId,
    author: prismaUserToMember(row.author),
    parentType: row.parentType as CommentParentType,
    parentId: row.parentId,
    body: row.body,
    image: row.image ?? null,
    parentCommentId: row.parentCommentId ?? undefined,
    createdAt: relativeTime(row.createdAt),
  };
}

const INCLUDE = {
  author: { include: { role: { select: { name: true } } } },
} as const;

/** List ALL comments (top-level + replies) for a content item.
 *
 * Returns them flat, ordered by createdAt. The UI's `CommentList`
 * threads them into a tree (one level of nesting; replies-to-replies
 * collapse to the same level — matches LINE/Facebook UX expectations
 * and avoids 5-level indentation hell on mobile). */
export async function listCommentsDb(
  parentType: CommentParentType,
  parentId: string,
): Promise<Comment[]> {
  const rows = await db.comment.findMany({
    where: { parentType, parentId },
    orderBy: { createdAt: "asc" },
    include: INCLUDE,
  });
  return rows.map(toComment);
}

export async function countCommentsDb(
  parentType: CommentParentType,
  parentId: string,
): Promise<number> {
  return db.comment.count({ where: { parentType, parentId } });
}
