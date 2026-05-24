import { ActivityCard } from "@/modules/core/activities";
import { PostCard } from "@/modules/core/posts";
import { PollCard } from "@/modules/core/polls";
import type { FeedItem as FeedItemType } from "../queries";

export function FeedItem({ item }: { item: FeedItemType }) {
  switch (item.kind) {
    case "activity": return <ActivityCard activity={item.data} />;
    case "post":     return <PostCard post={item.data} />;
    case "poll":     return <PollCard poll={item.data} />;
  }
}
