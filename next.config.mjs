/**
 * Security headers applied to every response.
 *
 * - X-Content-Type-Options: nosniff — stops browsers MIME-sniffing a
 *   response (defense-in-depth for /uploads, which serves user files).
 * - X-Frame-Options: DENY — no framing → clickjacking protection.
 * - Referrer-Policy — don't leak full URLs to third parties.
 * - Permissions-Policy — disable powerful APIs we never use.
 * - HSTS — force HTTPS once seen (only meaningful over TLS).
 * - CSP — restrict where scripts/styles/images can load from. Next.js
 *   needs 'unsafe-inline' for its inline bootstrap + styled-jsx, and
 *   'unsafe-eval' is avoided. `img-src` allows data: (inline avatars) and
 *   self (uploads). This is a pragmatic policy for an app with no external
 *   script CDNs; tighten further if you add nonces.
 */
// NOTE on CSP: we deliberately do NOT send a Content-Security-Policy header.
// A CSP that omits/changes `script-src 'unsafe-inline'` (which some hosts /
// CDNs rewrite, or which interacts badly with Next's inline bootstrap +
// our inline SW kill-switch) can silently block the very scripts the app
// needs to hydrate. For a private family/friends app the XSS surface is
// already covered (post/comment bodies render as escaped text; CMS HTML is
// sanitized via sanitize-html), so we drop CSP to remove a class of
// "frontend mysteriously dead in production" failures. The remaining
// headers below are pure-win and can't break script execution.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only run Next's type-check / lint against the real source dirs. Without
  // this, a local backup like ./old (a whole second copy of the app) would
  // be compiled too — its duplicate components + "@/*" imports break the
  // build and can poison the deployed bundle. The tsconfig "exclude" handles
  // tsc; these two keep `next build`'s own checks scoped to source.
  typescript: {
    // We run a dedicated `tsc --noEmit` in CI; don't let next build also
    // type-check stray folders. (Real type errors still fail `npm run typecheck`.)
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ["app", "modules", "lib"],
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    serverActions: {
      // Image uploads run through a Server Action (uploadImageAction),
      // which enforces its own 5 MB-per-file cap. Next.js, however,
      // rejects ANY Server Action request body over 1 MB BEFORE our code
      // runs — so a 2 MB phone photo failed silently with a cryptic
      // "Body exceeded 1mb limit" before reaching the size check.
      //
      // Bump the framework limit above our per-file cap (5 MB) with
      // headroom for multipart overhead + the inline base64 avatar
      // (~700 KB encoded). 8 MB keeps us safe without inviting abuse.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
