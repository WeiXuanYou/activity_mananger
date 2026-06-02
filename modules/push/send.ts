import "server-only";
/**
 * Web Push fan-out. `pushToUser()` sends a notification payload to every
 * browser/device a user has subscribed. Mirrors the notify() seam: one
 * entry point, fire-and-forget, never throws into the caller.
 *
 * Requires VAPID keys in the environment:
 *   VAPID_PUBLIC_KEY   — also exposed to the client for subscribe()
 *   VAPID_PRIVATE_KEY  — server-only
 *   VAPID_SUBJECT      — "mailto:you@example.com" (optional, has default)
 *
 * If the keys are unset, push is silently disabled (the in-app bell still
 * works) — so a dev/clone without keys runs fine.
 */
import webpush from "web-push";
import { db } from "@/lib/db";

let configured: boolean | null = null;

/** Lazily configure web-push from env. Returns false if keys are missing. */
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!pub || !priv) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:admin@together.local",
    pub,
    priv,
  );
  configured = true;
  return true;
}

/** Is push configured (keys present)? Used by UI to decide whether to
 *  show the "enable notifications" button. */
export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export type PushPayload = {
  title: string;
  body: string;
  link?: string;
};

/**
 * Send a payload to all of a user's push subscriptions. Dead subscriptions
 * (410 Gone / 404) are pruned automatically so the table self-heals.
 */
export async function pushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err) {
        const code = (err as { statusCode?: number } | null)?.statusCode;
        // 404/410 mean the subscription is dead — remove it.
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => undefined);
        } else {
          // eslint-disable-next-line no-console
          console.warn("[push] send failed", { code, endpoint: s.endpoint.slice(0, 40) });
        }
      }
    }),
  );
}
