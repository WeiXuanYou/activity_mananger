import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to `max` then blocks", () => {
    const rl = createRateLimiter({ max: 3, windowMs: 1000 });
    const k = "1.2.3.4";
    expect(rl.check(k).allowed).toBe(true);
    rl.hit(k); rl.hit(k); rl.hit(k); // 3 failures
    const r = rl.check(k);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("reset() clears the window (success path)", () => {
    const rl = createRateLimiter({ max: 2, windowMs: 1000 });
    const k = "ip";
    rl.hit(k); rl.hit(k);
    expect(rl.check(k).allowed).toBe(false);
    rl.reset(k);
    expect(rl.check(k).allowed).toBe(true);
  });

  it("window expires after windowMs", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1000 });
    const k = "ip";
    rl.hit(k);
    expect(rl.check(k).allowed).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rl.check(k).allowed).toBe(true);
  });

  it("keys are independent (per-IP isolation)", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1000 });
    rl.hit("attacker");
    expect(rl.check("attacker").allowed).toBe(false);
    expect(rl.check("innocent").allowed).toBe(true); // victim not affected
  });

  it("check() does not consume budget", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1000 });
    const k = "ip";
    expect(rl.check(k).allowed).toBe(true);
    expect(rl.check(k).allowed).toBe(true); // still allowed; only hit() counts
  });
});
