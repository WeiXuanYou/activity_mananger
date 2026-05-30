"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePostAction } from "@/modules/core/posts/actions";
import type { Post, PostKind } from "@/modules/core/posts";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES } from "@/modules/core/categories";

/**
 * Edit-only form for posts. Mirrors NewPostForm's visual, but uses
 * imperative state + updatePostAction (instead of the FormData useActionState
 * pattern) since editing pre-fills every control and the field set is small.
 */
export function EditPostForm({
  post,
  categories,
  canPin,
}: {
  post: Post;
  categories: Category[];
  canPin: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>(post.kind);
  const [title, setTitle] = useState(post.title ?? "");
  const [body, setBody] = useState(post.body);
  const [isPinned, setIsPinned] = useState(post.isPinned);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    (post.categories ?? []).map((c) => c.slug).filter(Boolean),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleCat = (slug: string) => {
    setSelectedSlugs((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 3 ? cur : [...cur, slug],
    );
  };

  const submit = () => {
    if (!body.trim()) return setError("內文不能空白");
    setError(null);
    startTransition(async () => {
      try {
        await updatePostAction({
          id: post.id,
          title: title.trim() || null,
          body,
          kind,
          isPinned: canPin ? isPinned : undefined,
          categorySlugs: selectedSlugs,
        });
        router.push("/app/feed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "儲存失敗");
      }
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink/80">類型</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as PostKind)}
          className="mt-2 w-full px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm"
        >
          <option value="ARTICLE">📝 文章</option>
          <option value="RECOMMENDATION">⭐ 推薦</option>
          <option value="NOTE">💭 隨筆</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">標題（可選）</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">內文</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
        />
      </label>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink/80">🏷 分類（最多 3 個）</span>
          <span className="text-xs text-ink/40">已選 {selectedSlugs.length} / 3</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const c = COLOR_CLASSES[cat.color];
            const isSel = selectedSlugs.includes(cat.slug);
            const disabled = !isSel && selectedSlugs.length >= 3;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCat(cat.slug)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                  isSel
                    ? `${c.bg} text-white border-transparent shadow-card`
                    : disabled
                    ? "bg-cream/40 text-ink/30 border-sand cursor-not-allowed"
                    : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {canPin && (
        <label className="flex items-start gap-3 px-3 py-2.5 rounded-soft border bg-cream/30 border-sand cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="mt-1 rounded text-terracotta"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">📌 置頂於 Feed 最上方</div>
          </div>
        </label>
      )}

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <button
          onClick={submit}
          disabled={pending}
          className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "儲存中..." : "儲存變更"}
        </button>
        <span className="ml-auto text-xs text-ink/40">儲存後回動態</span>
      </div>
    </div>
  );
}
