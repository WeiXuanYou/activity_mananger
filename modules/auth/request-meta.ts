import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort read of the incoming request's origin and client IP from
 * the proxy headers. Centralized so the recovery-link builder and the
 * login rate limiter agree on how we derive these.
 *
 * Caveats:
 *   - Behind a proxy you trust (Vercel, nginx with `proxy_set_header`),
 *     `x-forwarded-*` are reliable. With NO trusted proxy a client can
 *     spoof them — acceptable here because the IP only feeds a
 *     best-effort rate limiter, never an authorization decision.
 *   - `origin` falls back to the APP_URL env, then localhost for dev.
 */
export async function getRequestMeta(): Promise<{ origin?: string; ip: string }> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("host");
    const origin = host ? `${proto}://${host}` : process.env.APP_URL || undefined;
    // x-forwarded-for can be a comma list "client, proxy1, proxy2";
    // the first hop is the original client.
    const fwd = h.get("x-forwarded-for");
    const ip =
      (fwd ? fwd.split(",")[0]?.trim() : "") ||
      h.get("x-real-ip") ||
      "unknown";
    return { origin, ip };
  } catch {
    return { origin: process.env.APP_URL || undefined, ip: "unknown" };
  }
}
