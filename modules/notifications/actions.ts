"use server";
/**
 * Server actions for notifications — marking read. Reading your own
 * notifications needs no special permission beyond being signed in.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";

export async function markAllReadAction() {
  const me = await requireCurrentUser();
  await db.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });
  revalidatePath("/app/notifications");
  revalidatePath("/app/feed");
}

export async function markReadAction(notificationId: string) {
  const me = await requireCurrentUser();
  // Scope to the current user so you can't mark someone else's as read
  await db.notification.updateMany({
    where: { id: notificationId, userId: me.id },
    data: { read: true },
  });
  revalidatePath("/app/notifications");
}
