/**
 * Types for the mixed timeline (feed) — extracted to honour the standard
 * module contract (types.ts) used by every other module under `core/`.
 *
 * The feed is a **composition** module: it does not own its own data,
 * it joins multiple sources (activities, posts, polls). Adding a new
 * content type to the timeline means:
 *   1. Add a new branch to {@link FeedItem}
 *   2. Push items from the new source in `queries.ts > buildFeed`
 *   3. Handle the new branch in `components/FeedItem.tsx`
 */
import type { Activity } from "@/modules/core/activities";
import type { Post } from "@/modules/core/posts";
import type { Poll } from "@/modules/core/polls";

/** A single entry in the timeline — discriminated by `kind`. */
export type FeedItem =
  | { kind: "activity"; data: Activity }
  | { kind: "post"; data: Post }
  | { kind: "poll"; data: Poll };

/** Options accepted by {@link buildFeed}. */
export type FeedBuildOptions = {
  /** Filter the timeline to a single category slug. `undefined` or `"all"` = no filter. */
  categorySlug?: string;
};
