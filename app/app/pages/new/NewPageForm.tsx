"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCustomPageAction, type CreatePageState } from "@/modules/custom-pages/actions";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES } from "@/modules/core/categories";

export function NewPageForm({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState<CreatePageState | undefined, FormData>(
    createCustomPageAction,
    undefined,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState("# 標題\n\n第一段內容...\n\n## 子標題\n\n- 重點 1\n- 重點 2\n\n> 引文段落");

  const toggle = (s: string) => {
    setSelected((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= 3 ? cur : [...cur, s],
    );
  };

  return (
    <form action={action} className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink/80">標題</span>
        <input
          name="title"
          required
          placeholder="例如：外公的故事"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
        <span className="text-xs text-ink/40 mt-1 block">網址會自動產生，不用自己輸入。</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">摘要</span>
        <input
          name="excerpt"
          placeholder="一兩句話介紹這個頁面"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
        />
      </label>

      <div>
        <label className="text-sm font-medium text-ink/80 mb-2 block">
          第一個 block · Markdown
        </label>
        <textarea
          name="markdown"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta font-mono text-sm"
        />
        <p className="text-xs text-ink/50 mt-1">
          支援標準 Markdown + GFM（表格、待辦清單、刪除線）。建立完之後可以再加其他類型的 block。
        </p>
      </div>

      {selected.map((s) => <input key={s} type="hidden" name="category" value={s} />)}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink/80">🏷 分類（最多 3）</span>
          <span className="text-xs text-ink/40">已選 {selected.length} / 3</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const c = COLOR_CLASSES[cat.color];
            const isSel = selected.includes(cat.slug);
            const disabled = !isSel && selected.length >= 3;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.slug)}
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

      {state?.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <SubmitButton />
        <span className="text-xs text-ink/40">建立後自動跳到頁面</span>
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
      {pending ? "建立中..." : "建立頁面"}
    </button>
  );
}
