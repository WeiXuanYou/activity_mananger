/**
 * Phase F — DB-backed queries for notifications.
 */
import { db } from "@/lib/db";
import type { Notification, NotificationKind } from "./types";

type NotificationRow = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-TW");
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    link: row.link ?? undefined,
    read: row.read,
    createdAt: relativeTime(row.createdAt),
  };
}

export async function listNotificationsDb(userId: string, limit = 30): Promise<Notification[]> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toNotification);
}

export async function unreadCountDb(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}
