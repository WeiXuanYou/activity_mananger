import Link from "next/link";
import type { Category } from "../types";
import { COLOR_CLASSES } from "../types";

/**
 * URL-driven category filter. Reads the active slug from `activeSlug` (the
 * page passes searchParams.cat) and renders Links that update the query
 * string. Server-component-friendly — no client state.
 */
export function CategoryFilterBar({
  categories,
  activeSlug,
  basePath,
}: {
  categories: Category[];
  activeSlug?: string;
  basePath: string;
}) {
  const allActive = !activeSlug || activeSlug === "all";

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <Link
        href={basePath}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
          allActive
            ? "bg-ink text-white border-transparent shadow-card"
            : "bg-white text-ink/70 border-sand hover:bg-cream/50"
        }`}
      >
        <span className="leading-none">✨</span>
        <span>全部</span>
      </Link>
      {categories.map((cat) => {
        const c = COLOR_CLASSES[cat.color];
        const isActive = activeSlug === cat.slug;
        return (
          <Link
            key={cat.id}
            href={`${basePath}?cat=${cat.slug}`}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
              isActive
                ? `${c.bg} text-white border-transparent shadow-card`
                : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
            }`}
          >
            <span className="leading-none">{cat.emoji}</span>
            <span>{cat.name}</span>
          </Link>
        );
      })}
      <button className="shrink-0 ml-1 px-3 py-1.5 rounded-full text-sm text-ink/50 hover:text-terracotta border border-dashed border-sand">
        ＋ 新分類
      </button>
    </div>
  );
}
