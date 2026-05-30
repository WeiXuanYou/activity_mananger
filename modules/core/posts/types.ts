import type { Member } from "@/modules/core/members";
import type { Category } from "@/modules/core/categories";

export type PostKind = "ARTICLE" | "RECOMMENDATION" | "NOTE";

/**
 * Post — the UI shape used by both mock and DB sources.
 *
 * `author` and `categories` are OPTIONAL pre-resolved fields:
 *   - DB-backed sources (Phase C) populate them via the adapter
 *   - mock-backed sources (Phase A `data.ts`) leave them undefined
 *     and UI components fall back to sync `findMember(authorId)` /
 *     `findCategoriesByIds(categoryIds)`
 *
 * Carrying the same TS type across both sources means UI components
 * never have to know which source the data came from.
 */
export type Post = {
  id: string;
  authorId: string;
  author?: Member;
  kind: PostKind;
  title?: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  isPinned?: boolean;
  pinnedById?: string;
  categoryIds: string[];
  categories?: Category[];
  /** Set to a truthy ISO when the owner / a moderator manually hid this. */
  hiddenAt?: string | null;
};
