import { ActivityCard } from "@/modules/core/activities";
import { PostCard } from "@/modules/core/posts";
import { PollCard } from "@/modules/core/polls";
import type { FeedItem as FeedItemType } from "../types";

/**
 * Renders one timeline entry. Pattern-matches on the discriminant
 * (`item.kind`) and delegates to the appropriate card component from
 * the corresponding sub-module.
 *
 * Adding a new content type: extend the `FeedItem` union in `types.ts`,
 * push instances in `queries.ts > buildFeed`, then add a `case` here.
 */
export function FeedItem({ item }: { item: FeedItemType }) {
  switch (item.kind) {
    case "activity": return <ActivityCard activity={item.data} />;
    case "post":     return <PostCard post={item.data} />;
    case "poll":     return <PollCard poll={item.data} />;
  }
}
