/**
 * Post card — renders a single post in the feed.
 *
 * Pinned posts get a warm terracotta gradient + an explicit "📌 由管理員置頂"
 * header so they don't feel like spam. They're rendered separately in
 * <PinnedSection/> at the top of the feed; the main timeline filters
 * them out (see `modules/core/feed/queries.ts`).
 *
 * Like button: pass `likedByMe` to render the live optimistic-UI
 * LikeButton. Omit it (mockup pages) and a static heart is shown instead.
 */
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import type { Post } from "../types";
import { BONUS_KINDS } from "../types";
import { LikeButton } from "./LikeButton";

/** Short prefix shown in the top-right kind chip. */
const KIND_LABEL = {
  ARTICLE: "📝 文章",
  RECOMMENDATION: "⭐ 推薦",
  NOTE: "💭 隨筆",
} as const;

export function PostCard({
  post,
  likedByMe,
  ownerActions,
}: {
  post: Post;
  likedByMe?: boolean;
  /** Server-rendered owner-actions menu (⋯ Edit/Delete). Caller decides
   *  visibility — present → render, absent → no menu. */
  ownerActions?: React.ReactNode;
}) {
  // Prefer pre-resolved fields (DB source); fall back to sync mock lookup
  const author = post.author ?? findMember(post.authorId);
  const cats = post.categories ?? findCategoriesByIds(post.categoryIds);
  return (
    <article
      className={`rounded-soft border p-5 hover:shadow-soft transition ${
        post.isPinned
          ? "bg-gradient-to-br from-terracotta-soft/30 to-cream shadow-soft border-terracotta/30"
          : "bg-white shadow-card border-sand/60"
      }`}
    >
      {post.isPinned && (
        <div className="flex items-center gap-2 mb-3 text-xs text-terracotta-dark font-medium">
          <span>📌 由管理員置頂</span>
          <span className="text-ink/40">·</span>
          <span className="text-ink/50">所有人都會看到</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <Avatar member={author} size={36} />
        <div>
          <div className="text-sm font-medium text-ink">{author.name}</div>
          <div className="text-xs text-ink/50">{post.createdAt}</div>
        </div>
        <span className="ml-auto text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full">
          {KIND_LABEL[post.kind]}
        </span>
        {ownerActions}
      </div>
      {post.title && <h3 className="serif text-xl text-ink mb-2">{post.title}</h3>}
      <p className="text-ink/75 leading-relaxed mb-3">{post.body}</p>
      {post.bonus && (() => {
        const meta = post.bonusKind ? BONUS_KINDS[post.bonusKind] : null;
        const emoji = meta?.emoji ?? "🎁";
        const headlineParts: string[] = ["獎勵"];
        if (meta) headlineParts.push(meta.label);
        if (post.bonusLimit) headlineParts.push(`前 ${post.bonusLimit} 名`);
        return (
          <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-soft bg-amber-50 border border-amber-200/70">
            <span className="text-base leading-none mt-0.5">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-amber-700 tracking-widest uppercase">
                {headlineParts.join(" · ")}
              </div>
              <div className="text-sm text-amber-900/85 leading-relaxed mt-0.5">{post.bonus}</div>
            </div>
          </div>
        );
      })()}
      {cats.length > 0 && (
        <div className="mb-3"><CategoryChipList categories={cats} size="xs" /></div>
      )}
      <div className="flex items-center gap-4 text-sm text-ink/60 pt-3 border-t border-sand/70">
        {likedByMe !== undefined ? (
          <LikeButton postId={post.id} initialLiked={likedByMe} initialCount={post.likes} />
        ) : (
          <button className="flex items-center gap-1.5 hover:text-terracotta transition">
            ❤️ <span>{post.likes}</span>
          </button>
        )}
        <span className="flex items-center gap-1.5 text-ink/60">
          💬 <span>{post.comments}</span>
        </span>
        <span className="ml-auto text-xs text-ink/40">公開於相聚內</span>
      </div>
    </article>
  );
}
