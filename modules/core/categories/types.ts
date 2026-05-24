export type CategoryColor =
  | "terracotta"
  | "sage"
  | "sand"
  | "cream"
  | "lavender"
  | "sky"
  | "rose";

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

/** Mapping of color keys to Tailwind class fragments. */
export const COLOR_CLASSES: Record<CategoryColor, { bg: string; bgSoft: string; text: string; ring: string }> = {
  terracotta: { bg: "bg-terracotta",   bgSoft: "bg-terracotta-soft/40", text: "text-terracotta-dark", ring: "ring-terracotta/30" },
  sage:       { bg: "bg-sage",         bgSoft: "bg-sage-soft/40",       text: "text-sage-dark",       ring: "ring-sage/30" },
  sand:       { bg: "bg-sand",         bgSoft: "bg-sand/60",            text: "text-ink/70",          ring: "ring-sand" },
  cream:      { bg: "bg-cream",        bgSoft: "bg-cream",              text: "text-ink/70",          ring: "ring-sand" },
  lavender:   { bg: "bg-[#B58FBF]",    bgSoft: "bg-[#E5D7EA]",          text: "text-[#6B4D78]",       ring: "ring-[#B58FBF]/30" },
  sky:        { bg: "bg-[#8FA7B7]",    bgSoft: "bg-[#D6E1E9]",          text: "text-[#3F5A6E]",       ring: "ring-[#8FA7B7]/30" },
  rose:       { bg: "bg-[#D98090]",    bgSoft: "bg-[#F4D4DA]",          text: "text-[#8A3A48]",       ring: "ring-[#D98090]/30" },
};
