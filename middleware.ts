/**
 * Edge middleware — first line of authentication.
 *
 * Why a middleware at all when pages already check session?
 * - Pre-empts unauthenticated users from triggering server-component
 *   rendering / Prisma queries (saves work)
 * - Provides a uniform redirect-with-`?next=` UX
 *
 * Why does it ONLY check for the cookie's existence (not validity)?
 * - Edge runtime can't easily reach Prisma; full session validation
 *   requires a DB lookup
 * - Validity is enforced by the page itself via `getCurrentUser()`
 *   in `app/app/layout.tsx`. If a cookie exists but the token is
 *   forged, the page sees `null` and redirects (no security gap)
 *
 * Add new protected prefixes by appending to the `matcher` array
 * AND updating `PROTECTED_PREFIX` (or refactor to support multiple).
 */
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIX = "/app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Defensive: matcher already filters this, but keep an explicit check
  // in case the matcher is widened later.
  if (!pathname.startsWith(PROTECTED_PREFIX)) return NextResponse.next();

  const hasSession = req.cookies.has("together_session");
  if (hasSession) return NextResponse.next();

  // Redirect to /login, preserving the original destination so the
  // login flow can bounce the user back after success.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
