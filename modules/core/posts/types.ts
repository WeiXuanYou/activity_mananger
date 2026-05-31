import type { Member } from "@/modules/core/members";
import type { Category } from "@/modules/core/categories";

export type PostKind = "ARTICLE" | "RECOMMENDATION" | "NOTE";

/**
 * Post — the UI shape used by both mock and DB sources.
 *
 * `author` and `categories` are OPTIONAL pre-resolved fields:
 *   - DB-backed sources (Phase C) populate them via the adapter
 *   - mock-backed sources (Phase A `data.ts`) leave them undefined
 *     and UI components fall back to sync `findMember(authorId)` /
 *     `findCategoriesByIds(categoryIds)`
 *
 * Carrying the same TS type across both sources means UI components
 * never have to know which source the data came from.
 */
export type Post = {
  id: string;
  authorId: string;
  author?: Member;
  kind: PostKind;
  title?: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  isPinned?: boolean;
  pinnedById?: string;
  categoryIds: string[];
  categories?: Category[];
  /** Set to a truthy ISO when the owner / a moderator manually hid this. */
  hiddenAt?: string | null;
  /** Optional reward / bonus description authored by the post creator
   *  (free-text, e.g. "前 3 個 RSVP 的人請喝咖啡"). When non-null,
   *  PostCard renders a 🎁 獎勵 panel. */
  bonus?: string | null;
  /** Structured kind hint — picks the headline emoji + label on the
   *  card. NULL falls back to the generic 🎁. */
  bonusKind?: BonusKind | null;
  /** "Open to the first N people". NULL = unlimited / unspecified. */
  bonusLimit?: number | null;
  /** Attached images (original + thumbnail URLs). Empty when none. */
  images?: PostImage[];
  /** When true, any signed-in member can edit this post (author opt-in).
   *  Delete / hide stay owner-or-moderator regardless. */
  allowCollab?: boolean;
};

/** One image attached to a post. `thumbUrl` falls back to `url`. */
export type PostImage = {
  url: string;
  thumbUrl?: string;
};

/** Max images per post — keeps the card readable + the inline JSON small. */
export const MAX_POST_IMAGES = 6;

/** Coarse bonus categories. UI maps these to emoji + label; the choices
 *  match the family/friends use cases the feature was added for:
 *
 *    MEAL   — 請吃飯 / 帶宵夜
 *    DRINK  — 請喝咖啡 / 飲料
 *    MONEY  — 紅包 / 現金獎勵
 *    TASK   — 完成任務換取的回報（不一定是金錢）
 *    OTHER  — 描述自由發揮
 *
 * Stored as a string column (no Prisma enum) so adding a new kind
 * doesn't need a migration — just extend BONUS_KINDS below. */
export type BonusKind = "MEAL" | "DRINK" | "MONEY" | "TASK" | "OTHER";

/** Render metadata for each kind. Single source of truth — used by the
 *  form (selector) and the card (badge). */
export const BONUS_KINDS: Record<BonusKind, { emoji: string; label: string }> = {
  MEAL:  { emoji: "🍜", label: "請吃飯" },
  DRINK: { emoji: "☕", label: "請喝飲料" },
  MONEY: { emoji: "🧧", label: "紅包 / 現金" },
  TASK:  { emoji: "✅", label: "任務獎勵" },
  OTHER: { emoji: "🎁", label: "其他" },
};
