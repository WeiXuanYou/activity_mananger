import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort read of the incoming request's origin and client IP from
 * the proxy headers. Centralized so the recovery-link builder, the
 * rate limiter, and any future audit logging agree on the derivation.
 *
 * Trust model:
 *   - `x-forwarded-for` is only honoured when `TRUST_PROXY=true` is
 *     set in the environment. Without that flag we ignore the
 *     headers entirely and fall back to a per-deployment constant —
 *     because a client connecting directly to the app can spoof those
 *     headers freely, and we'd rather collapse to one bucket and lose
 *     fine-grained rate-limiting than be neutered by trivial forgery.
 *   - When `TRUST_PROXY=true` (typical for Vercel / nginx / Caddy
 *     setups), the leftmost address in `x-forwarded-for` is taken as
 *     the client IP.
 *   - `origin` always falls back to `APP_URL` then `localhost`.
 */
export async function getRequestMeta(): Promise<{ origin?: string; ip: string }> {
  const trustProxy = process.env.TRUST_PROXY === "true";
  try {
    const h = await headers();
    // Origin derivation order, most-trustworthy first:
    //   1. APP_URL — if the operator set it, ALWAYS use it. This is the one
    //      thing that's guaranteed to be the real public URL, so email
    //      verification / password-reset links can't end up pointing at an
    //      internal hostname or localhost. (Common email-link bug.)
    //   2. x-forwarded-host (set by reverse proxies) + x-forwarded-proto
    //   3. the Host header
    const appUrl = process.env.APP_URL?.trim();
    let origin: string | undefined;
    if (appUrl) {
      origin = appUrl.replace(/\/$/, "");
    } else {
      const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
      const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
      origin = host ? `${proto}://${host}` : undefined;
    }
    let ip = "unknown";
    if (trustProxy) {
      const fwd = h.get("x-forwarded-for");
      ip = (fwd ? fwd.split(",")[0]?.trim() : "") || h.get("x-real-ip") || "unknown";
    }
    return { origin, ip };
  } catch (e) {
    // Header context unavailable (e.g. called outside a request). The
    // limiter caller treats "unknown" as one shared bucket; it's the
    // safe-but-noisy default. Log so a real misconfiguration is visible.
    console.warn("[request-meta] headers() failed:", (e as Error).message);
    return { origin: process.env.APP_URL?.trim()?.replace(/\/$/, "") || undefined, ip: "unknown" };
  }
}
