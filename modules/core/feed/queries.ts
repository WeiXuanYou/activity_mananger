import { listActivities } from "@/modules/core/activities";
import { listPosts } from "@/modules/core/posts";
import { listPolls } from "@/modules/core/polls";
import { findCategoryBySlug } from "@/modules/core/categories";
import type { Activity } from "@/modules/core/activities";
import type { Post } from "@/modules/core/posts";
import type { Poll } from "@/modules/core/polls";

export type FeedItem =
  | { kind: "activity"; data: Activity }
  | { kind: "post"; data: Post }
  | { kind: "poll"; data: Poll };

/**
 * Build the mixed timeline. Filter by category slug if provided.
 * Phase A: interleaves all sources; B+ swaps for a DB query.
 *
 * Extend by adding another listX() source + pushing into items.
 */
export function buildFeed(opts: { categorySlug?: string } = {}): FeedItem[] {
  const activities = listActivities();
  const posts = listPosts().filter((p) => !p.isPinned);
  const polls = listPolls();

  const all: FeedItem[] = [
    ...activities.map((a): FeedItem => ({ kind: "activity", data: a })),
    ...posts.map((p): FeedItem => ({ kind: "post", data: p })),
    ...polls.map((p): FeedItem => ({ kind: "poll", data: p })),
  ];

  if (!opts.categorySlug || opts.categorySlug === "all") return all;

  const cat = findCategoryBySlug(opts.categorySlug);
  if (!cat) return all;

  return all.filter((item) => item.data.categoryIds.includes(cat.id));
}
