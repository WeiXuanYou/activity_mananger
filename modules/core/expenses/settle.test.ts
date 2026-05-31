import { describe, it, expect } from "vitest";
import { computeSettlement } from "./settle";
import type { Balance } from "./types";

// Minimal Balance factory — the algo only reads userId + net.
const b = (userId: string, net: number): Balance => ({
  userId,
  member: { id: userId, name: userId, handle: userId, role: "Member", avatarColor: "#000", initial: "X", avatarImage: null },
  paid: 0,
  owes: 0,
  net,
});

describe("computeSettlement", () => {
  it("returns no transfers when everyone is even", () => {
    expect(computeSettlement([b("a", 0), b("b", 0)])).toEqual([]);
  });

  it("settles one debtor to one creditor", () => {
    // a is owed 100 (net +100), b owes 100 (net -100)
    expect(computeSettlement([b("a", 100), b("b", -100)])).toEqual([
      { fromUserId: "b", toUserId: "a", amountCents: 100 },
    ]);
  });

  it("matches largest debtor to largest creditor first", () => {
    // a owed 200, b even, c owes 200
    expect(computeSettlement([b("a", 200), b("b", 0), b("c", -200)])).toEqual([
      { fromUserId: "c", toUserId: "a", amountCents: 200 },
    ]);
  });

  it("splits a debtor across multiple creditors", () => {
    // a owes 300; b owed 200; c owed 100
    expect(computeSettlement([b("a", -300), b("b", 200), b("c", 100)])).toEqual([
      { fromUserId: "a", toUserId: "b", amountCents: 200 },
      { fromUserId: "a", toUserId: "c", amountCents: 100 },
    ]);
  });

  it("ignores sub-cent rounding slack (no 1-cent transfers)", () => {
    expect(computeSettlement([b("a", -1), b("b", 1)])).toEqual([]);
  });

  it("conserves money — total transferred equals total owed", () => {
    const t = computeSettlement([b("a", 300), b("b", -100), b("c", -200)]);
    const out = t.reduce((s, x) => s + x.amountCents, 0);
    expect(out).toBe(300);
  });

  it("terminates (no infinite loop) on lopsided inputs", () => {
    const t = computeSettlement([b("a", -500), b("b", 100), b("c", 100), b("d", 300)]);
    expect(t.reduce((s, x) => s + x.amountCents, 0)).toBe(500);
  });
});
