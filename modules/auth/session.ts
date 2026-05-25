/**
 * Cookie-based session management for "相聚 Together".
 *
 * Lifecycle:
 *   1. User redeems an invite code  → `redeemInvite()` in `./invite.ts`
 *   2. Server action calls          → `createSession(userId)` + `setSessionCookie(token)`
 *   3. Subsequent request           → `getCurrentUser()` reads cookie,
 *                                     hashes it, looks up the session row
 *   4. Sign-out                     → `signOut()` deletes the session row
 *                                     AND clears the cookie
 *
 * Security model:
 *   - The cookie value is a random 32-byte hex token (`crypto.randomBytes`).
 *   - We store ONLY the SHA-256 of the token in DB (`Session.tokenHash`).
 *     If the DB is exfiltrated, the leaked hashes can't be used to forge
 *     cookies — only the legitimate plaintext token (held by the browser)
 *     can hit a matching row.
 *   - Cookie is `httpOnly` (no JS access), `sameSite=lax` (no cross-site
 *     CSRF), and `secure` in production.
 *
 * This file is **server-only** — it imports `next/headers`. Don't import
 * it from a client component; import from `./actions.ts` instead.
 */
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const COOKIE_NAME = "together_session";
const SESSION_TTL_DAYS = 30;

/** SHA-256 of the plaintext token. Constant-time comparison not needed
 *  because the lookup is by indexed unique column (DB engine handles it). */
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Issue a brand new session row and return the *plaintext* token.
 * Caller is responsible for putting that token into the cookie via
 * {@link setSessionCookie}. Never log the returned token.
 */
export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId, tokenHash: hash(token), expiresAt, userAgent },
  });
  return token;
}

/** Write the session token into the browser cookie jar. */
export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,                                  // unreachable by document.cookie
    sameSite: "lax",                                  // safe default for nav
    secure: process.env.NODE_ENV === "production",    // HTTPS-only in prod
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Remove the session cookie. Does NOT delete the DB row. */
export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

/**
 * Return the currently signed-in user (with role + role.permissions),
 * or `null` if there's no valid session.
 *
 * Cheap enough to call from any server component — Prisma's SQLite query
 * is sub-ms for the seeded data. If hot-path latency ever matters, wrap
 * this in `React.cache()`.
 */
export async function getCurrentUser() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: {
      user: {
        include: {
          // Eager-include the role and its permissions so callers can
          // do `user.role.name` and `user.role.permissions[i].permission.key`
          // without follow-up queries.
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

/** The non-null shape returned by {@link getCurrentUser}. */
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Same as {@link getCurrentUser} but throws on missing session.
 * Use this in server components or actions that have already been
 * gated by `middleware.ts` (so the throw can only happen if the
 * cookie was tampered with).
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

/**
 * Sign out: delete the session row (so the token is dead even if
 * somehow exfiltrated) AND clear the cookie.
 *
 * `deleteMany` is used because `delete` would throw on missing row;
 * if the user clicks sign-out twice quickly the second call should
 * be a no-op, not an error.
 */
export async function signOut() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  }
  await clearSessionCookie();
}
