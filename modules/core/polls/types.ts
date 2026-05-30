import type { Member } from "@/modules/core/members";
import type { Category } from "@/modules/core/categories";

export type PollOption = {
  id: string;
  label: string;
  votes: number;
  addedById?: string;
};

export type PollStatus = "OPEN" | "CLOSING_SOON" | "CLOSED";

/**
 * STANDARD — text options ("烏來泡湯", "陽明山野餐"...).
 * SCHEDULE — Doodle-style; each option's label is an ISO datetime string
 * and the UI renders weekday + date + time. The top-voted option is
 * surfaced as the "suggested common time".
 */
export type PollKind = "STANDARD" | "SCHEDULE";

/**
 * Poll — UI shape. `author` is optional/pre-resolved for DB-backed sources
 * (see notes on Post/Activity for the same pattern).
 */
export type Poll = {
  id: string;
  question: string;
  authorId: string;
  author?: Member;
  kind: PollKind;
  options: PollOption[];
  totalVotes: number;
  closesAt: string;       // YYYY-MM-DD (display form)
  closesAtIso: string | null;  // full ISO datetime — for edit flows
  closesIn: string;       // human-readable countdown
  multiSelect: boolean;
  anonymous: boolean;
  allowAddOption: boolean;
  status: PollStatus;
  categoryIds: string[];
  categories?: Category[];
  /** Set to a truthy ISO when the owner / a moderator manually hid this. */
  hiddenAt?: string | null;
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};
