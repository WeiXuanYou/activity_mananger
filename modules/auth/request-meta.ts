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
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("host");
    const origin = host ? `${proto}://${host}` : process.env.APP_URL || undefined;
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
    return { origin: process.env.APP_URL || undefined, ip: "unknown" };
  }
}
