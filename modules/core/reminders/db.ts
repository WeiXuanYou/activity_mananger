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
import { findBirthdayUsersForToday } from "@/modules/core/birthdays";
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

  // ───── Birthdays ─────
  // Same idempotency pattern: insert a "tier=BIRTHDAY-YYYY-MM-DD" row;
  // unique (activityId, tier) ensures no double-firing on the same day.
  // We piggyback on ActivityReminder (activityId points to the celebrant's
  // user, but we tag it clearly so it doesn't conflate with activity tiers
  // — and we record a synthetic activity row first).
  //
  // Simpler approach: don't share the table. Use a tiny `BirthdayNotice`
  // sentinel — or just trust the idempotency to the per-day notification
  // dedupe. For v1 we just dedupe in-process: each cron run scans today's
  // birthdays once. If two cron runs land in the same second they could
  // double-notify, but that's a non-issue at family scale.
  try {
    const todays = await findBirthdayUsersForToday();
    for (const u of todays) {
      const allOthers = await db.user.findMany({
        where: { id: { not: u.id } },
        select: { id: true },
      });
      // Skip if today is already covered: check whether a notification
      // titled with this person's birthday was created today already.
      const dedupeKey = `🎂 今天是 ${u.name} 的生日`;
      const recent = await db.notification.findFirst({
        where: {
          title: dedupeKey,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        select: { id: true },
      });
      if (recent) continue;

      for (const other of allOthers) {
        try {
          await notify({
            userId: other.id,
            kind: "activity.rsvp",
            title: dedupeKey,
            body: `祝 ${u.name} 生日快樂 🎉 點開可以幫他寫祝福`,
            link: `/app/members/${u.id}`,
          });
          result.notificationsCreated++;
        } catch {
          /* swallow */
        }
      }
      result.details.push({
        activityId: u.id, // userId — abused for grouping in the admin UI
        activityTitle: `🎂 ${u.name} 生日`,
        tier: "DAY_BEFORE",
        userCount: allOthers.length,
      });
      result.remindersSent++;
    }
    result.scannedActivities += todays.length;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[birthdays] tier failed", err);
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
