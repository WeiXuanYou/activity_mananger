import type { Member } from "@/modules/core/members";

/**
 * What a comment can hang off of. Matches `Comment.parentType` in Prisma.
 * Polymorphic so the same table serves posts / activities / pages /
 * thread-replies — adding a new commentable thing doesn't change schema.
 */
export type CommentParentType = "POST" | "ACTIVITY" | "PAGE" | "COMMENT";

export type Comment = {
  id: string;
  authorId: string;
  author?: Member;
  parentType: CommentParentType;
  parentId: string;
  body: string;
  /** Optional single attached image URL. */
  image?: string | null;
  parentCommentId?: string;
  createdAt: string; // relative time for UI display
};
