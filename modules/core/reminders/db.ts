/**
 * Activity reminder cron logic.
 *
 * Tiers:
 *   - DAY_BEFORE  → fire when startsAt ∈ [now, now + 26h]
 *   - HOUR_BEFORE → fire when startsAt ∈ [now, now + 2.5h]
 *
 * The windows extend a bit past 24h / 2h so a slow/missed run still
 * catches activities — idempotency comes from the
 * `ActivityReminder(activityId, tier)` unique constraint, NOT from
 * tight scheduling.
 *
 * Each fire creates one notification per GOING participant. MAYBEs
 * deliberately excluded — we don't want to nag people who haven't
 * committed.
 */
import { db } from "@/lib/db";
import { notify } from "@/modules/notifications";
import type { ReminderTier, ReminderRunResult } from "./types";

const HOUR = 60 * 60 * 1000;

const TIER_CONFIG: Record<ReminderTier, {
  windowMs: number;
  /** Title used in the notification — picked up by the bell list. */
  titleFor: (activityTitle: string) => string;
  body: (activityTitle: string, startsAt: Date) => string;
}> = {
  DAY_BEFORE: {
    windowMs: 26 * HOUR,
    titleFor: (t) => `📅 明天有「${t}」`,
    body: (t, d) =>
      `明天 ${d.toLocaleString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })} ` +
      `見囉。記得 ${t}！`,
  },
  HOUR_BEFORE: {
    windowMs: 2.5 * HOUR,
    titleFor: (t) => `⏰ 「${t}」快開始了`,
    body: (t, d) =>
      `${d.toLocaleString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })} ` +
      `就開始。出門前再看一眼 ${t} 的細節吧。`,
  },
};

/**
 * Scan all upcoming activities and send reminders that are due.
 *
 * Safe to call as often as you like — `(activityId, tier)` unique
 * constraint stops duplicate sends. Returns a summary for the admin UI.
 */
export async function runActivityReminders(): Promise<ReminderRunResult> {
  const now = new Date();
  const result: ReminderRunResult = {
    scannedActivities: 0,
    remindersSent: 0,
    notificationsCreated: 0,
    details: [],
  };

  for (const tier of ["DAY_BEFORE", "HOUR_BEFORE"] as const) {
    const { windowMs, titleFor, body } = TIER_CONFIG[tier];
    const horizon = new Date(now.getTime() + windowMs);

    // Activities starting in the window that haven't been reminded at THIS tier
    const candidates = await db.activity.findMany({
      where: {
        startsAt: { gte: now, lte: horizon },
        reminders: { none: { tier } },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        participants: {
          where: { status: "GOING" },
          select: { userId: true },
        },
      },
    });

    result.scannedActivities += candidates.length;

    for (const a of candidates) {
      // Idempotency belt-and-suspenders: try to insert the reminder row
      // first. If a parallel run already created it, the unique constraint
      // throws — we swallow and skip.
      try {
        await db.activityReminder.create({
          data: {
            activityId: a.id,
            tier,
            notifiedUserCount: a.participants.length,
          },
        });
      } catch {
        // Already created by another run; safe to skip
        continue;
      }

      const title = titleFor(a.title);
      const text = body(a.title, a.startsAt);

      for (const p of a.participants) {
        try {
          await notify({
            userId: p.userId,
            kind: "activity.rsvp", // reuses the existing notification kind
            title,
            body: text,
            link: `/app/activity/${a.id}`,
          });
          result.notificationsCreated++;
        } catch {
          // Notification failure must NOT poison the run
        }
      }

      result.remindersSent++;
      result.details.push({
        activityId: a.id,
        activityTitle: a.title,
        tier,
        userCount: a.participants.length,
      });
    }
  }

  return result;
}

/**
 * Read the most recent N reminder rows for the admin panel "last activity"
 * view. Ordered newest first.
 */
export async function listRecentReminders(limit = 10): Promise<{
  id: string;
  activityId: string;
  activityTitle: string;
  tier: string;
  sentAt: string;
  notifiedUserCount: number;
}[]> {
  const rows = await db.activityReminder.findMany({
    orderBy: { sentAt: "desc" },
    take: limit,
    include: { activity: { select: { title: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    activityId: r.activityId,
    activityTitle: r.activity.title,
    tier: r.tier,
    sentAt: r.sentAt.toISOString(),
    notifiedUserCount: r.notifiedUserCount,
  }));
}
