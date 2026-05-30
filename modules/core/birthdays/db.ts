/**
 * Birthday queries. Two questions answered:
 *   1. Whose birthday is today? (for the cron)
 *   2. Whose birthday is in the next N days? (for the feed widget)
 *
 * We DON'T compare DateTime equality — birth year is irrelevant for the
 * "is it today" question. SQLite has no `date_part` so the comparison
 * happens in JS after a single full-table scan. The User table is tiny
 * (10s of family members) so this is cheaper than indexing month-day.
 */
import { db } from "@/lib/db";
import type { UpcomingBirthday } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days between two calendar days (midnight to midnight in local TZ). */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** When is this person's birthday next, relative to `from`? Returns the
 *  next future occurrence (this year if it hasn't happened yet, next
 *  year otherwise). Used to compute "days away" + age-on-that-day. */
function nextBirthdayAfter(birthday: Date, from: Date): Date {
  const m = birthday.getMonth();
  const d = birthday.getDate();
  let year = from.getFullYear();
  let cand = new Date(year, m, d);
  if (cand < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    year++;
    cand = new Date(year, m, d);
  }
  return cand;
}

/** Users whose birthday is today (month-day match). For the cron. */
export async function findBirthdayUsersForToday(): Promise<{
  id: string; name: string; birthday: Date;
}[]> {
  const now = new Date();
  const rows = await db.user.findMany({
    where: { birthday: { not: null } },
    select: { id: true, name: true, birthday: true },
  });
  return rows.flatMap((r) =>
    r.birthday &&
    r.birthday.getMonth() === now.getMonth() &&
    r.birthday.getDate() === now.getDate()
      ? [{ id: r.id, name: r.name, birthday: r.birthday }]
      : [],
  );
}

/** Birthdays within the next N days (inclusive of today). For the widget.
 *  Returns at most N people, sorted by daysAway ascending. */
export async function listUpcomingBirthdays(days = 14): Promise<UpcomingBirthday[]> {
  const now = new Date();
  const rows = await db.user.findMany({
    where: { birthday: { not: null } },
    select: { id: true, name: true, avatarColor: true, initial: true, birthday: true },
  });

  const upcoming = rows.flatMap((r) => {
    if (!r.birthday) return [];
    const next = nextBirthdayAfter(r.birthday, now);
    const daysAway = daysBetween(now, next);
    if (daysAway > days) return [];
    const turningAge = next.getFullYear() - r.birthday.getFullYear();
    return [{
      userId: r.id,
      name: r.name,
      avatarColor: r.avatarColor,
      initial: r.initial,
      daysAway,
      dateLabel: `${String(next.getMonth() + 1).padStart(2, "0")}/${String(next.getDate()).padStart(2, "0")}`,
      turningAge,
    }];
  });

  upcoming.sort((a, b) => a.daysAway - b.daysAway);
  return upcoming;
}
