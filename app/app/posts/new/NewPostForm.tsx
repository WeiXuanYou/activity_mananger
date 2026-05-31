"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPostFormAction, type CreatePostState } from "@/modules/core/posts/actions";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES, CreateCategoryModal } from "@/modules/core/categories";

export function NewPostForm({
  categories: initialCategories,
  canPin,
  canCreateCategory,
}: {
  categories: Category[];
  canPin: boolean;
  canCreateCategory: boolean;
}) {
  // Hold categories in local state so a newly-created one shows up in
  // the picker without a full page navigation.
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [createCatOpen, setCreateCatOpen] = useState(false);
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
          {canCreateCategory && (
            <button
              type="button"
              onClick={() => setCreateCatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border border-dashed border-sand text-ink/50 hover:text-terracotta"
            >
              ＋ 新分類
            </button>
          )}
        </div>
      </div>

      <CreateCategoryModal
        open={createCatOpen}
        onClose={() => setCreateCatOpen(false)}
        onCreated={(cat) => {
          // Insert into the local list and auto-select it.
          setCategories((cur) => [...cur, cat]);
          if (selectedSlugs.length < 3) setSelectedSlugs((cur) => [...cur, cat.slug]);
        }}
      />

      <BonusToggle />

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

/**
 * Optional "加入獎勵" toggle. Folded into the same form via two named
 * inputs: `bonusOn` (checkbox) gates whether `bonus` (text) is taken
 * into account by the server action. We render them inside one card
 * because they're conceptually one switch.
 */
function BonusToggle() {
  const [on, setOn] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="rounded-soft border border-sand bg-amber-50/40">
      <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
        <input
          name="bonusOn"
          type="checkbox"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="mt-1 rounded text-amber-600"
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-ink">🎁 加入獎勵（可選）</div>
          <div className="text-xs text-ink/55 mt-0.5">
            幫這篇貼文掛一個小獎勵 —— 例：前 3 個 RSVP 的人請喝咖啡 ☕、完成幫忙送 100 元紅包。會顯示在貼文上。
          </div>
        </div>
      </label>
      {on && (
        <div className="px-3 pb-3 pt-1">
          <input
            name="bonus"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            placeholder="獎勵內容（200 字內）"
            className="w-full px-3 py-2 rounded-soft border border-amber-200 bg-white focus:outline-none focus:border-amber-400 text-sm"
            autoFocus
          />
          <div className="text-[11px] text-ink/40 mt-1 text-right">{text.length} / 200</div>
        </div>
      )}
    </div>
  );
}
