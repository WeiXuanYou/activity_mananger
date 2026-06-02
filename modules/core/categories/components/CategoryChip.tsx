import Link from "next/link";
import type { Category } from "../types";
import { COLOR_CLASSES } from "../types";

/** Render a category's icon — uploaded image if present, else the emoji.
 *  Shared so chips / filter bar / pickers all show custom icons. */
export function CategoryIcon({ category, px = 16 }: { category: Category; px?: number }) {
  if (category.iconImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={category.iconImage}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: px, height: px }}
      />
    );
  }
  return <span className="leading-none">{category.emoji}</span>;
}

export function CategoryChip({
  category,
  size = "sm",
  href,
}: {
  category: Category;
  size?: "xs" | "sm" | "md";
  href?: string;
}) {
  const c = COLOR_CLASSES[category.color];
  const sizeCls = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  }[size];

  const iconPx = size === "xs" ? 12 : size === "sm" ? 14 : 18;
  const inner = (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${c.bgSoft} ${c.text} ${sizeCls}`}>
      <CategoryIcon category={category} px={iconPx} />
      <span>{category.name}</span>
    </span>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function CategoryChipList({
  categories,
  size = "sm",
}: {
  categories: Category[];
  size?: "xs" | "sm" | "md";
}) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.map((c) => (
        <CategoryChip key={c.id} category={c} size={size} />
      ))}
    </div>
  );
}
