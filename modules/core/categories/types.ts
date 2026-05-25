/**
 * The category palette. Each color maps to a set of Tailwind classes
 * so UI components don't hard-code colors.
 *
 * The first four (terracotta / sage / sand / cream) come from the
 * theme tokens defined in `tailwind.config.ts`. The last three
 * (lavender / sky / rose) use arbitrary color literals because they
 * are accent colors used only by categories.
 */
export type CategoryColor =
  | "terracotta"
  | "sage"
  | "sand"
  | "cream"
  | "lavender"
  | "sky"
  | "rose";

/**
 * A category tag attached to posts, activities, polls, and custom pages.
 *
 * Two flavours:
 *   - `isDefault: true`  → system-seeded (生活 / 美食 / 旅遊 ...). Cannot be deleted.
 *   - `isDefault: false` → user-created. Owned by `createdById`.
 *
 * URL routing uses `slug`; DB joins use `id`. Both are unique.
 */
export type Category = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  isDefault: boolean;
  createdById?: string;
  description?: string;
};

/**
 * Look-up table: color name → the four Tailwind class fragments needed
 * to style a chip (background solid, background soft, text, ring).
 *
 * Adding a new color: add the key to {@link CategoryColor} above and
 * extend this object. Every consuming component (Chip / Picker /
 * FilterBar) will automatically support it.
 */
export const COLOR_CLASSES: Record<CategoryColor, { bg: string; bgSoft: string; text: string; ring: string }> = {
  terracotta: { bg: "bg-terracotta",   bgSoft: "bg-terracotta-soft/40", text: "text-terracotta-dark", ring: "ring-terracotta/30" },
  sage:       { bg: "bg-sage",         bgSoft: "bg-sage-soft/40",       text: "text-sage-dark",       ring: "ring-sage/30" },
  sand:       { bg: "bg-sand",         bgSoft: "bg-sand/60",            text: "text-ink/70",          ring: "ring-sand" },
  cream:      { bg: "bg-cream",        bgSoft: "bg-cream",              text: "text-ink/70",          ring: "ring-sand" },
  lavender:   { bg: "bg-[#B58FBF]",    bgSoft: "bg-[#E5D7EA]",          text: "text-[#6B4D78]",       ring: "ring-[#B58FBF]/30" },
  sky:        { bg: "bg-[#8FA7B7]",    bgSoft: "bg-[#D6E1E9]",          text: "text-[#3F5A6E]",       ring: "ring-[#8FA7B7]/30" },
  rose:       { bg: "bg-[#D98090]",    bgSoft: "bg-[#F4D4DA]",          text: "text-[#8A3A48]",       ring: "ring-[#D98090]/30" },
};
