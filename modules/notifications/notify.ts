"use server";
/**
 * notify() — the single function other modules call to create an in-app
 * notification for a user. Mirrors the `analytics.emit()` seam: one entry
 * point, fire-and-forget, never throws into the caller's flow.
 *
 * Unlike analytics (which is a firewalled read-only consumer), notifications
 * are part of the core social experience, so this writes directly to the
 * Notification table.
 */
import { db } from "@/lib/db";
import type { NotificationKind } from "./types";

export async function notify(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    // Never let a notification failure break the action that triggered it
    // eslint-disable-next-line no-console
    console.error("[notify] failed", { kind: input.kind, err });
  }
}
