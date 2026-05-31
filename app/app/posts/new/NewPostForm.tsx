"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPostFormAction, type CreatePostState } from "@/modules/core/posts/actions";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES, CreateCategoryModal } from "@/modules/core/categories";
import { BONUS_KINDS } from "@/modules/core/posts";
import type { BonusKind } from "@/modules/core/posts";

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
 * Optional "加入獎勵" block. Folded into the same form via four named
 * inputs:
 *   - `bonusOn`     — checkbox; gates everything below
 *   - `bonusKind`   — coarse category (MEAL / DRINK / MONEY / TASK / OTHER)
 *   - `bonusLimit`  — recipient cap (1–999, blank = unlimited)
 *   - `bonus`       — free-text description (required when bonusOn)
 *
 * Server action validates each field independently — `bonus` is the only
 * required one when the toggle's on; kind/limit gracefully fall back to
 * null if blank or invalid.
 */
function BonusToggle() {
  const [on, setOn] = useState(false);
  const [kind, setKind] = useState<BonusKind>("MEAL");
  const [limit, setLimit] = useState("");
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
            幫這篇貼文掛一個小獎勵。會在貼文上以醒目色塊顯示。
          </div>
        </div>
      </label>
      {on && (
        <div className="px-3 pb-3 pt-1 space-y-2.5">
          <div>
            <div className="text-xs font-medium text-ink/70 mb-1.5">獎勵類型</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BONUS_KINDS) as BonusKind[]).map((k) => {
                const meta = BONUS_KINDS[k];
                const sel = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                      sel
                        ? "bg-amber-500 text-white border-transparent shadow-card"
                        : "bg-white text-ink/70 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="bonusKind" value={kind} />
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <label className="block">
              <div className="text-xs font-medium text-ink/70 mb-1.5">人數上限（可空白）</div>
              <input
                name="bonusLimit"
                type="number"
                min={1}
                max={999}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="例：3"
                className="w-28 px-3 py-2 rounded-soft border border-amber-200 bg-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </label>
            <p className="text-[11px] text-ink/50 leading-tight pb-1">
              空白 = 不限人數<br/>填數字 = 前 N 名
            </p>
          </div>

          <div>
            <div className="text-xs font-medium text-ink/70 mb-1.5">獎勵內容</div>
            <input
              name="bonus"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              placeholder="例：請喝外公家咖啡 / 100 元紅包 / 一頓晚餐"
              className="w-full px-3 py-2 rounded-soft border border-amber-200 bg-white focus:outline-none focus:border-amber-400 text-sm"
            />
            <div className="text-[11px] text-ink/40 mt-1 text-right">{text.length} / 200</div>
          </div>

          {text.trim() && (
            <BonusPreview kind={kind} limit={limit} text={text} />
          )}
        </div>
      )}
    </div>
  );
}

/** Mini preview of how the bonus will render on the card. */
function BonusPreview({ kind, limit, text }: { kind: BonusKind; limit: string; text: string }) {
  const meta = BONUS_KINDS[kind];
  const n = Number.parseInt(limit, 10);
  const limitLabel = Number.isFinite(n) && n >= 1 ? `前 ${n} 名` : "不限人數";
  return (
    <div className="mt-2 px-3 py-2 rounded-soft bg-amber-50 border border-amber-200/70 flex items-start gap-2">
      <span className="text-base leading-none mt-0.5">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-amber-700 tracking-widest uppercase">
          獎勵 · {meta.label} · {limitLabel}
        </div>
        <div className="text-sm text-amber-900/85 leading-relaxed mt-0.5">{text}</div>
      </div>
    </div>
  );
}
