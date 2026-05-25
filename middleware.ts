import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — protects /app/* by checking for the session cookie.
 * Real session validation (token hash lookup in DB) happens in the page's
 * Server Component via getCurrentUser(). This middleware only filters out
 * obviously unauthenticated traffic.
 */
const PROTECTED_PREFIX = "/app";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROTECTED_PREFIX)) return NextResponse.next();

  const hasSession = req.cookies.has("together_session");
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
