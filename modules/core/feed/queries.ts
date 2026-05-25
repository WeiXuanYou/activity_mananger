/**
 * Feed query — composes the mixed timeline from multiple core sources.
 *
 * The feed module is **read-only and stateless**: it owns no data of its
 * own, only joins outputs from {@link listActivities}, {@link listPosts},
 * {@link listPolls} into a typed union ({@link FeedItem}).
 *
 * Phase A: synchronous join of mock data.
 * Phase C: this function becomes async and queries the DB through Prisma,
 *          ordered by `createdAt` desc with pagination. The signature
 *          (`opts: FeedBuildOptions → FeedItem[]`) stays the same, so
 *          callers don't change.
 */
import { listActivities } from "@/modules/core/activities";
import { listPosts } from "@/modules/core/posts";
import { listPolls } from "@/modules/core/polls";
import { findCategoryBySlug } from "@/modules/core/categories";
import type { FeedItem, FeedBuildOptions } from "./types";

/**
 * Build the mixed timeline. Skips pinned posts because the page renders
 * them in a dedicated section above the main feed.
 *
 * Adding a new content type:
 *   1. Add a branch to `FeedItem` in `types.ts`
 *   2. Push items from the new source into `all` here
 *   3. Render the new branch in `components/FeedItem.tsx`
 */
export function buildFeed(opts: FeedBuildOptions = {}): FeedItem[] {
  const activities = listActivities();
  // Pinned posts are surfaced separately by <PinnedSection/>, so we
  // exclude them here to avoid duplicating them in the main timeline.
  const posts = listPosts().filter((p) => !p.isPinned);
  const polls = listPolls();

  const all: FeedItem[] = [
    ...activities.map((a): FeedItem => ({ kind: "activity", data: a })),
    ...posts.map((p): FeedItem => ({ kind: "post", data: p })),
    ...polls.map((p): FeedItem => ({ kind: "poll", data: p })),
  ];

  if (!opts.categorySlug || opts.categorySlug === "all") return all;

  // Slug lookup is cheap (linear scan over ~12 categories). We resolve the
  // slug to an ID here so each item only does a simple `includes(id)` check.
  const cat = findCategoryBySlug(opts.categorySlug);
  if (!cat) return all;

  return all.filter((item) => item.data.categoryIds.includes(cat.id));
}
