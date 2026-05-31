"use server";
/**
 * Push subscription server actions — called by the client after the browser
 * grants notification permission and produces a PushSubscription object.
 */
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Save (or refresh) a push subscription for the current user. Idempotent
 *  on `endpoint` — re-subscribing the same browser updates the keys. */
export async function savePushSubscriptionAction(sub: BrowserSubscription): Promise<{ ok: boolean }> {
  const me = await requireCurrentUser();
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };

  const ua = (await headers()).get("user-agent") ?? null;

  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: me.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: ua },
    create: {
      userId: me.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: ua,
    },
  });
  return { ok: true };
}

/** Remove a subscription by endpoint (user disabled notifications on this
 *  device). Only deletes rows owned by the caller. */
export async function deletePushSubscriptionAction(endpoint: string): Promise<{ ok: boolean }> {
  const me = await requireCurrentUser();
  if (!endpoint) return { ok: false };
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: me.id } });
  return { ok: true };
}
