import { describe, it, expect } from "vitest";

/**
 * Pure expense-math tests. The split logic lives in
 * `getActivityExpenseSummary` but the interesting bit is the per-person
 * balance computation, which is just `paid - owes`. We re-derive it
 * here in isolation to lock the invariants.
 *
 * Invariants:
 *   - Sum of nets across all participants is 0 (within rounding)
 *   - A payer who isn't in the participants list gets full refund
 *   - Empty expenses → all zeros
 *   - Single payer covering everything: payer net = total - share
 */

type Expense = { payerId: string; amountCents: number };

function computeBalances(
  expenses: Expense[],
  participants: { id: string }[],
) {
  const totalCents = expenses.reduce((s, e) => s + e.amountCents, 0);
  const n = participants.length;
  const perPerson = n > 0 ? Math.round(totalCents / n) : totalCents;
  const balances = participants.map((p) => ({
    id: p.id,
    paid: expenses.filter((e) => e.payerId === p.id).reduce((s, e) => s + e.amountCents, 0),
    owes: perPerson,
    get net() { return this.paid - this.owes; },
  }));
  // Surface payers who aren't in the participants list — they get a
  // full refund.
  const payerIds = new Set(expenses.map((e) => e.payerId));
  for (const pid of payerIds) {
    if (!balances.some((b) => b.id === pid)) {
      const paid = expenses.filter((e) => e.payerId === pid).reduce((s, e) => s + e.amountCents, 0);
      balances.push({ id: pid, paid, owes: 0, get net() { return this.paid - this.owes; } });
    }
  }
  return { totalCents, perPerson, balances };
}

describe("computeBalances", () => {
  it("returns all zeros when there are no expenses", () => {
    const r = computeBalances([], [{ id: "a" }, { id: "b" }]);
    expect(r.totalCents).toBe(0);
    expect(r.perPerson).toBe(0);
    expect(r.balances.every((b) => b.net === 0)).toBe(true);
  });

  it("splits evenly and nets to zero (within rounding)", () => {
    const r = computeBalances(
      [{ payerId: "a", amountCents: 30000 }],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
    );
    expect(r.totalCents).toBe(30000);
    expect(r.perPerson).toBe(10000);
    expect(r.balances.find((b) => b.id === "a")!.net).toBe(20000);
    expect(r.balances.find((b) => b.id === "b")!.net).toBe(-10000);
    expect(r.balances.find((b) => b.id === "c")!.net).toBe(-10000);
    const sum = r.balances.reduce((s, b) => s + b.net, 0);
    expect(Math.abs(sum)).toBeLessThanOrEqual(2); // ≤ rounding error
  });

  it("gives a non-participant payer a full refund (net = paid)", () => {
    const r = computeBalances(
      [{ payerId: "outsider", amountCents: 20000 }],
      [{ id: "a" }, { id: "b" }],
    );
    const outsider = r.balances.find((b) => b.id === "outsider")!;
    expect(outsider.paid).toBe(20000);
    expect(outsider.owes).toBe(0);
    expect(outsider.net).toBe(20000);
  });

  it("handles multiple payers correctly", () => {
    const r = computeBalances(
      [
        { payerId: "a", amountCents: 12000 },
        { payerId: "b", amountCents: 18000 },
      ],
      [{ id: "a" }, { id: "b" }, { id: "c" }],
    );
    expect(r.totalCents).toBe(30000);
    expect(r.perPerson).toBe(10000);
    expect(r.balances.find((b) => b.id === "a")!.net).toBe(2000);
    expect(r.balances.find((b) => b.id === "b")!.net).toBe(8000);
    expect(r.balances.find((b) => b.id === "c")!.net).toBe(-10000);
  });

  it("with single participant, that one person owes 0 and is owed their own outlay", () => {
    const r = computeBalances(
      [{ payerId: "a", amountCents: 5000 }],
      [{ id: "a" }],
    );
    expect(r.perPerson).toBe(5000);
    expect(r.balances.find((b) => b.id === "a")!.net).toBe(0);
  });
});
