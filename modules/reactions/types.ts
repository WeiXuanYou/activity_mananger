/**
 * Reaction kinds. The DB stores `Reaction.kind` as a free-text string
 * (so adding a kind needs no migration); this is the canonical set the
 * UI offers + how each renders.
 *
 * Product rule: ONE reaction per user per item. Picking a different kind
 * replaces the previous one; picking the same kind again removes it.
 * (Matches Facebook / LINE expectations families already know.)
 */
export type ReactionKind = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "SAD" | "CELEBRATE";

/** What a reaction can hang off of. Mirrors Comment/Reaction.parentType. */
export type ReactionParentType = "POST" | "ACTIVITY" | "COMMENT" | "PAGE";

/** Render metadata per kind — single source of truth for the bar + summary. */
export const REACTION_KINDS: Record<ReactionKind, { emoji: string; label: string }> = {
  LIKE:      { emoji: "👍", label: "讚" },
  LOVE:      { emoji: "❤️", label: "愛心" },
  LAUGH:     { emoji: "😂", label: "哈哈" },
  WOW:       { emoji: "😮", label: "哇" },
  SAD:       { emoji: "😢", label: "嗚嗚" },
  CELEBRATE: { emoji: "🎉", label: "慶祝" },
};

/** Ordered list for rendering the picker. */
export const REACTION_ORDER: ReactionKind[] = ["LIKE", "LOVE", "LAUGH", "WOW", "SAD", "CELEBRATE"];

export function isReactionKind(v: string): v is ReactionKind {
  return v in REACTION_KINDS;
}

/** Aggregate reaction state for one item, ready for the UI. */
export type ReactionSummary = {
  /** count per kind (only kinds with >=1 present) */
  counts: Partial<Record<ReactionKind, number>>;
  /** total across all kinds */
  total: number;
  /** the current viewer's reaction kind, if any */
  mine: ReactionKind | null;
};
