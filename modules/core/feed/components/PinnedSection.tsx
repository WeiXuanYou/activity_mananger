import { PostCard, listPinnedPosts } from "@/modules/core/posts";

export function PinnedSection() {
  const pinned = listPinnedPosts();
  if (pinned.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-terracotta-dark font-medium px-1">
        <span>📌 置頂</span>
        <div className="flex-1 divider-dashed" />
      </div>
      {pinned.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}
