/**
 * Tiny in-memory sliding-window rate limiter for public auth endpoints
 * (password login, invite redemption). Brute-forcing a handle's password
 * is the main thing this stops; the recovery flow has its own per-account
 * cooldown in `recovery.ts`.
 *
 * Design notes / deliberate trade-offs:
 *
 *   - **In-memory, per-process.** State lives in a module-level Map, so it
 *     resets on restart and is NOT shared across multiple instances. For
 *     the family/friends scale (single instance, SQLite) that's the right
 *     amount of machinery. The `RateLimiter` shape below is the seam:
 *     swap the Map for Redis/DB later without touching call sites.
 *
 *   - **Keyed by client IP, not by account.** Locking an *account* after N
 *     failures would let anyone lock a victim out just by failing logins
 *     on their handle (an account-lockout DoS). Keying on the attacker's
 *     own resource — their IP — avoids that. A real user almost never
 *     trips the limit; an attacker hammering from one IP does.
 *
 *   - **Failures count; successes clear.** We only record misses, and a
 *     successful login resets that IP's window, so a normal "typo then
 *     correct" sequence never accumulates toward a lockout.
 */

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number };

type Bucket = { count: number; resetAt: number };

export type RateLimiter = {
  /** Record a failed attempt for `key`. */
  hit(key: string): void;
  /** Check whether `key` may proceed, without recording anything. */
  check(key: string): RateLimitResult;
  /** Clear `key`'s window (call on success). */
  reset(key: string): void;
};

/** Build an in-memory limiter. `max` failures allowed per `windowMs`. */
export function createRateLimiter(opts: { max: number; windowMs: number }): RateLimiter {
  const { max, windowMs } = opts;
  const buckets = new Map<string, Bucket>();

  // Opportunistic GC so the Map can't grow unbounded under a flood of
  // distinct keys. Cheap: only runs when we touch the map.
  const sweep = (now: number) => {
    if (buckets.size < 10_000) return;
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  };

  return {
    hit(key) {
      const now = Date.now();
      sweep(now);
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        b.count += 1;
      }
    },
    check(key) {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) return { allowed: true, remaining: max };
      if (b.count >= max) return { allowed: false, retryAfterMs: b.resetAt - now };
      return { allowed: true, remaining: max - b.count };
    },
    reset(key) {
      buckets.delete(key);
    },
  };
}

/**
 * Shared limiter for password / invite login attempts: 10 failures per
 * IP per 15 minutes. Generous enough that a forgetful family member is
 * never blocked, tight enough that online password guessing is hopeless
 * against an 8+ char password.
 */
export const loginRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
});

/**
 * Public recovery endpoints (`/forgot` → password reset / handle lookup).
 * Tighter than login because:
 *   - there's no "I just mistyped" recovery path that requires retries
 *   - it's the surface an enumeration attacker would hammer
 *   - successful sends are GUESS-FREE for the attacker, so we count
 *     every hit, not just failures
 * 5 requests per 15 min per IP. A real user filling in their email
 * once or twice never trips it.
 */
export const recoveryRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
});

/**
 * "Change my password" while signed in. Lower volume than login —
 * 5 wrong-current-password attempts before we cool off — but keyed by
 * USER (not IP) so a hijacked session can't grind the limit on the
 * legitimate owner's IP while they're somewhere else.
 */
export const changePasswordRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
});
