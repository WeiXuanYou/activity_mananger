"use client";
import { useState } from "react";
import type { Category } from "../types";
import { COLOR_CLASSES } from "../types";

export function CategoryPicker({
  categories,
  defaultSelected = [],
  max = 3,
}: {
  categories: Category[];
  defaultSelected?: string[];
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      setSelected([...selected, id]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-ink/60 font-medium">🏷 分類（最多 {max} 個）</div>
        <div className="text-xs text-ink/40">已選 {selected.length} / {max}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const c = COLOR_CLASSES[cat.color];
          const isSel = selected.includes(cat.id);
          const disabled = !isSel && selected.length >= max;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                isSel
                  ? `${c.bg} text-white border-transparent shadow-card`
                  : disabled
                  ? "bg-cream/40 text-ink/30 border-sand cursor-not-allowed"
                  : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
              }`}
            >
              <span className="leading-none">{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-2 text-xs text-terracotta hover:underline"
      >
        ＋ 建立新分類
      </button>
    </div>
  );
}
