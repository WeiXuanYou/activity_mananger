import { listActivities } from "@/modules/core/activities";
import { listPosts } from "@/modules/core/posts";
import { listPolls } from "@/modules/core/polls";
import type { Activity } from "@/modules/core/activities";
import type { Post } from "@/modules/core/posts";
import type { Poll } from "@/modules/core/polls";

export type FeedItem =
  | { kind: "activity"; data: Activity }
  | { kind: "post"; data: Post }
  | { kind: "poll"; data: Poll };

/**
 * Build the mixed timeline. Phase A: interleaves all content.
 * Phase B+ swap to a real query joining recent events.
 *
 * Extend by adding another listX() source and pushing into items.
 */
export function buildFeed(opts: { categoryId?: string } = {}): FeedItem[] {
  const activities = listActivities();
  const posts = listPosts().filter((p) => !p.isPinned);
  const polls = listPolls();

  const all: FeedItem[] = [
    ...activities.map((a): FeedItem => ({ kind: "activity", data: a })),
    ...posts.map((p): FeedItem => ({ kind: "post", data: p })),
    ...polls.map((p): FeedItem => ({ kind: "poll", data: p })),
  ];

  if (!opts.categoryId || opts.categoryId === "all") return all;

  return all.filter((item) =>
    "categoryIds" in item.data ? item.data.categoryIds.includes(opts.categoryId!) : false
  );
}
