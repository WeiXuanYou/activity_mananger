import { describe, it, expect } from "vitest";
import { computeSettlement } from "./settle";

describe("computeSettlement", () => {
  it("returns no transfers when everyone is even", () => {
    expect(computeSettlement([
      { userId: "a", paid: 100, owes: 0 },
      { userId: "b", paid: 100, owes: 0 },
    ])).toEqual([]);
  });

  it("settles one debtor to one creditor", () => {
    // a paid everything, b owes their share
    const t = computeSettlement([
      { userId: "a", paid: 200, owes: -100 }, // group owes a 100
      { userId: "b", paid: 0, owes: 100 },    // b owes 100
    ]);
    expect(t).toEqual([{ fromUserId: "b", toUserId: "a", amountCents: 100 }]);
  });

  it("matches largest debtor to largest creditor first", () => {
    // a paid 300 (owes -200), b paid 100 (owes 0), c paid 0 (owes 200)
    const t = computeSettlement([
      { userId: "a", paid: 300, owes: -200 },
      { userId: "b", paid: 100, owes: 0 },
      { userId: "c", paid: 0, owes: 200 },
    ]);
    expect(t).toEqual([{ fromUserId: "c", toUserId: "a", amountCents: 200 }]);
  });

  it("splits a debtor across multiple creditors", () => {
    const t = computeSettlement([
      { userId: "a", paid: 0, owes: 300 },   // owes 300
      { userId: "b", paid: 0, owes: -200 },  // owed 200
      { userId: "c", paid: 0, owes: -100 },  // owed 100
    ]);
    // a pays b 200 (largest creditor) then c 100
    expect(t).toEqual([
      { fromUserId: "a", toUserId: "b", amountCents: 200 },
      { fromUserId: "a", toUserId: "c", amountCents: 100 },
    ]);
  });

  it("ignores sub-cent rounding slack (no 1-cent transfers)", () => {
    const t = computeSettlement([
      { userId: "a", paid: 0, owes: 1 },
      { userId: "b", paid: 0, owes: -1 },
    ]);
    expect(t).toEqual([]);
  });

  it("conserves money — total paid out equals total received", () => {
    const t = computeSettlement([
      { userId: "a", paid: 500, owes: -300 },
      { userId: "b", paid: 100, owes: 100 },
      { userId: "c", paid: 0, owes: 200 },
    ]);
    const out = t.reduce((s, x) => s + x.amountCents, 0);
    expect(out).toBe(300); // the two debtors' 100 + 200
  });
});
