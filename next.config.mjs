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
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy", value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
