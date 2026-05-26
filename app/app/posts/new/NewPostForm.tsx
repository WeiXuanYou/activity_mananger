"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPostFormAction, type CreatePostState } from "@/modules/core/posts/actions";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES } from "@/modules/core/categories";

export function NewPostForm({
  categories,
  canPin,
}: {
  categories: Category[];
  canPin: boolean;
}) {
  const [state, formAction] = useActionState<CreatePostState | undefined, FormData>(
    createPostFormAction,
    undefined,
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const toggleCat = (slug: string) => {
    setSelectedSlugs((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 3 ? cur : [...cur, slug],
    );
  };

  return (
    <form action={formAction} className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink/80">類型</span>
        <select
          name="kind"
          defaultValue="ARTICLE"
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
          name="title"
          placeholder="想分享什麼..."
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">內文</span>
        <textarea
          name="body"
          required
          placeholder="寫下你想分享的內容..."
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
          rows={8}
        />
      </label>

      {/* Hidden inputs sync the picker state to the form */}
      {selectedSlugs.map((s) => (
        <input key={s} type="hidden" name="category" value={s} />
      ))}

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

      <label
        className={`flex items-start gap-3 px-3 py-2.5 rounded-soft border transition cursor-pointer ${
          canPin ? "bg-cream/30 border-sand" : "bg-sand/30 border-sand cursor-not-allowed opacity-60"
        }`}
      >
        <input
          name="pin"
          type="checkbox"
          disabled={!canPin}
          className="mt-1 rounded text-terracotta"
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-ink">📌 發布後置頂於 Feed 最上方</div>
          <div className="text-xs text-ink/55 mt-0.5">
            需要 <strong>Editor</strong> 權限（<code>post.pin</code>）。
            {canPin ? " ✅ 你有權限" : " 你目前是 Member。"}
          </div>
        </div>
      </label>

      {state?.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <SubmitButton />
        <span className="ml-auto text-xs text-ink/40">公開給所有人</span>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? "發布中..." : "發布"}
    </button>
  );
}
