import type { Member } from "@/modules/core/members";

/** Coarse triage bucket for a feedback message. */
export type FeedbackKind = "BUG" | "IDEA" | "QUESTION" | "OTHER";

export type FeedbackStatus = "OPEN" | "RESOLVED";

/** Render metadata per kind — single source of truth for the form + inbox. */
export const FEEDBACK_KINDS: Record<FeedbackKind, { emoji: string; label: string }> = {
  BUG:      { emoji: "🐞", label: "問題 / Bug" },
  IDEA:     { emoji: "💡", label: "建議 / 想法" },
  QUESTION: { emoji: "❓", label: "提問" },
  OTHER:    { emoji: "💬", label: "其他" },
};

export type Feedback = {
  id: string;
  authorId?: string | null;
  author?: Member | null;
  kind: FeedbackKind;
  subject?: string | null;
  body: string;
  contact?: string | null;
  status: FeedbackStatus;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
};
