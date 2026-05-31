/**
 * Settlement — turn per-person balances ("paid vs owed") into a minimal
 * list of "X pays Y $Z" transfers so the group can settle up.
 *
 * Pure function, no I/O — easy to unit test. Greedy creditor/debtor
 * matching: repeatedly settle the largest debtor against the largest
 * creditor. For a family-sized group this produces the (near-)minimal
 * number of transfers, which is all anyone wants.
 */
import type { ExpenseBalance } from "./types";

export type Transfer = {
  fromUserId: string; // who pays
  toUserId: string;   // who receives
  amountCents: number;
};

/**
 * @param balances each person's net: positive `owes` = they still owe the
 *   group money (a debtor); negative `owes` = the group owes them (a
 *   creditor). This matches ExpenseBalance.owes (perPerson - paid).
 */
export function computeSettlement(balances: ExpenseBalance[]): Transfer[] {
  // Split into debtors (owe > 0) and creditors (owe < 0). Work in integer
  // cents throughout to avoid float drift.
  const debtors = balances
    .filter((b) => b.owes > 0)
    .map((b) => ({ userId: b.userId, amount: b.owes }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.owes < 0)
    .map((b) => ({ userId: b.userId, amount: -b.owes }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;
  // A penny of slack absorbs the rounding in perPerson (Math.round) so we
  // don't emit a meaningless 1-cent transfer at the end.
  const EPS = 1;

  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const pay = Math.min(d.amount, c.amount);
    if (pay > EPS) {
      transfers.push({ fromUserId: d.userId, toUserId: c.userId, amountCents: pay });
    }
    d.amount -= pay;
    c.amount -= pay;
    if (d.amount <= EPS) di++;
    if (c.amount <= EPS) ci++;
  }

  return transfers;
}
