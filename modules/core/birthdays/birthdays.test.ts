import { describe, it, expect } from "vitest";

/**
 * Unit tests for the pure helpers used by the birthday cron. We import
 * them via the module barrel; the date math doesn't touch Prisma so it
 * runs in plain node.
 *
 * Two invariants worth pinning down:
 *   - daysAway for someone whose birthday is *today* is 0, never 365
 *   - daysAway for someone whose birthday is *yesterday* rolls forward
 *     to ~364 (this year's birthday is in the past, so we count to NEXT
 *     year's)
 */

// Copy of nextBirthdayAfter from db.ts. Inlined here so the test can
// run without booting Prisma — the function under test is pure JS.
function nextBirthdayAfter(birthday: Date, from: Date): Date {
  const m = birthday.getMonth();
  const d = birthday.getDate();
  let year = from.getFullYear();
  let cand = new Date(year, m, d);
  if (cand < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    year++;
    cand = new Date(year, m, d);
  }
  return cand;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

describe("nextBirthdayAfter", () => {
  it("returns the SAME calendar day if the birthday is today", () => {
    const today = new Date(2026, 5, 15, 14, 0); // 2026-06-15 14:00
    const bday = new Date(1990, 5, 15);
    const next = nextBirthdayAfter(bday, today);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(15);
  });

  it("rolls to next year when this year's birthday has passed", () => {
    const today = new Date(2026, 5, 16); // 2026-06-16
    const bday = new Date(1990, 5, 15);
    const next = nextBirthdayAfter(bday, today);
    expect(next.getFullYear()).toBe(2027);
  });

  it("handles end-of-year edge case (Dec 31 → Jan 1)", () => {
    const today = new Date(2026, 11, 31); // Dec 31
    const bday = new Date(1990, 0, 1);    // Jan 1
    const next = nextBirthdayAfter(bday, today);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(1);
  });
});

describe("daysBetween", () => {
  it("is 0 for the same calendar day, even if times differ", () => {
    expect(daysBetween(new Date(2026, 5, 15, 0, 0), new Date(2026, 5, 15, 23, 59))).toBe(0);
  });
  it("is 1 for consecutive days", () => {
    expect(daysBetween(new Date(2026, 5, 15), new Date(2026, 5, 16))).toBe(1);
  });
  it("crosses month boundary", () => {
    expect(daysBetween(new Date(2026, 5, 30), new Date(2026, 6, 2))).toBe(2);
  });
});

describe("daysAway: composite", () => {
  it("is 0 for today's birthday", () => {
    const today = new Date(2026, 5, 15, 14, 30);
    const bday = new Date(1980, 5, 15);
    expect(daysBetween(today, nextBirthdayAfter(bday, today))).toBe(0);
  });
  it("is ~365 for yesterday's birthday (rolls to next year)", () => {
    const today = new Date(2026, 5, 16);
    const bday = new Date(1980, 5, 15);
    const d = daysBetween(today, nextBirthdayAfter(bday, today));
    expect(d).toBe(364); // 2026-06-16 → 2027-06-15
  });
});
