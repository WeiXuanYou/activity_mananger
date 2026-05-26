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
 * Poll — UI shape. `author` is optional/pre-resolved for DB-backed sources
 * (see notes on Post/Activity for the same pattern).
 */
export type Poll = {
  id: string;
  question: string;
  authorId: string;
  author?: Member;
  options: PollOption[];
  totalVotes: number;
  closesAt: string;       // ISO date
  closesIn: string;       // human-readable countdown
  multiSelect: boolean;
  anonymous: boolean;
  allowAddOption: boolean;
  status: PollStatus;
  categoryIds: string[];
  categories?: Category[];
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};
