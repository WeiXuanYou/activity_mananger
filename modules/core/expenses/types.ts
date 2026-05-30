import type { Member } from "@/modules/core/members";

/**
 * UI shape for an expense line. `payer` is pre-resolved by the DB
 * adapter so cards don't need to look up members in render.
 */
export type Expense = {
  id: string;
  activityId: string;
  payerId: string;
  payer?: Member;
  description: string;
  /** In 1/100 of currency unit (cents). */
  amountCents: number;
  currency: string;
  createdAt: string;        // ISO
  createdAtRelative: string; // "剛剛" / "3 天前"
};

/**
 * Per-person balance for an activity:
 *   paid   — what they've actually fronted
 *   owes   — their equal share of the total
 *   net    — paid - owes (positive = owed money; negative = owes money)
 *
 * We split equally across `participantCount` people, regardless of who
 * actually paid. v1 only supports equal splits. Upgrade path: add an
 * ExpenseSplit table for per-line allocations.
 */
export type Balance = {
  userId: string;
  member: Member;
  paid: number;
  owes: number;
  net: number;
};

export type ExpenseSummary = {
  expenses: Expense[];
  totalCents: number;
  perPersonCents: number;
  participantCount: number;
  currency: string;
  balances: Balance[];
};
