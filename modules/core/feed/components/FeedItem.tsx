import Link from "next/link";
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
 *
 * Polls are wrapped in a Link here because PollCard itself renders no
 * outer anchor (so callers can pick the destination). For the sync
 * mockup feed, we link to the mockup poll showcase.
 */
export function FeedItem({ item }: { item: FeedItemType }) {
  switch (item.kind) {
    case "activity": return (
      <Link href="/mockup/activity" className="block">
        <ActivityCard activity={item.data} />
      </Link>
    );
    case "post":     return <PostCard post={item.data} />;
    case "poll":     return (
      <Link href="/mockup/poll" className="block">
        <PollCard poll={item.data} />
      </Link>
    );
  }
}
