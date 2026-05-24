"use client";
import { useState } from "react";
import type { Category } from "../types";
import { COLOR_CLASSES } from "../types";

export function CategoryFilterBar({
  categories,
  defaultActive = "all",
  onChange,
}: {
  categories: Category[];
  defaultActive?: string;
  onChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultActive);
  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <FilterPill
        label="全部"
        emoji="✨"
        active={active === "all"}
        onClick={() => select("all")}
        tone="ink"
      />
      {categories.map((cat) => {
        const c = COLOR_CLASSES[cat.color];
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => select(cat.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
              isActive
                ? `${c.bg} text-white border-transparent shadow-card`
                : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
            }`}
          >
            <span className="leading-none">{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
      <button className="shrink-0 ml-1 px-3 py-1.5 rounded-full text-sm text-ink/50 hover:text-terracotta border border-dashed border-sand">
        ＋ 新分類
      </button>
    </div>
  );
}

function FilterPill({
  label, emoji, active, onClick, tone = "terracotta",
}: { label: string; emoji?: string; active: boolean; onClick: () => void; tone?: "terracotta" | "ink" }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
        active
          ? tone === "ink"
            ? "bg-ink text-white border-transparent shadow-card"
            : "bg-terracotta text-white border-transparent shadow-card"
          : "bg-white text-ink/70 border-sand hover:bg-cream/50"
      }`}
    >
      {emoji && <span className="leading-none">{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}
