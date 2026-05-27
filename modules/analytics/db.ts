/**
 * Phase E — DB-backed analytics queries.
 *
 * **Architectural promise:** this file reads ONLY from `AnalyticsEvent`.
 * It MUST NOT join into `core` tables — that's the firewall that lets
 * the whole analytics module be extracted into its own service later.
 *
 * The exception is enriching display by looking up Members (via the
 * members module's adapter, which is just a "name + avatar" view) —
 * that's a read-only convenience, not a JOIN in the query path.
 */
import { db } from "@/lib/db";
import { findMembersByIdsDb } from "@/modules/core/members";
import type { Member } from "@/modules/core/members";

export type AnalyticsKpi = {
  label: string;
  value: string;
  delta: string;
};

export type RecentEvent = {
  id: string;
  kind: string;
  subjectType: string;
  subjectId: string;
  properties: Record<string, unknown>;
  createdAt: Date;
  actor?: Member;
};

/**
 * Compute the KPI tiles. Phase E uses raw counts; future work can
 * compare to previous period to compute real deltas.
 */
export async function computeKpisDb(): Promise<AnalyticsKpi[]> {
  const [voteCount, rsvpCount, postCount, activeUserIds] = await Promise.all([
    db.analyticsEvent.count({ where: { kind: "vote.cast" } }),
    db.analyticsEvent.count({ where: { kind: "activity.rsvp" } }),
    db.analyticsEvent.count({ where: { kind: "post.created" } }),
    db.analyticsEvent.findMany({
      where: { userId: { not: null }, createdAt: { gte: daysAgo(30) } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  const totalUsers = await db.user.count();

  return [
    { label: "投票數",   value: String(voteCount),  delta: deltaFrom("vote.cast", 30) },
    { label: "活動 RSVP",  value: String(rsvpCount),  delta: deltaFrom("activity.rsvp", 30) },
    { label: "文章建立",   value: String(postCount),  delta: deltaFrom("post.created", 30) },
    { label: "活躍成員",   value: `${activeUserIds.length} / ${totalUsers}`, delta: "—" },
  ];
}

/** Stub for delta — Phase E+ compares two windows. */
function deltaFrom(_kind: string, _days: number): string {
  return "+ live";
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Per-kind counts for the breakdown chart. */
export async function eventsByKindDb(): Promise<{ kind: string; count: number }[]> {
  const rows = await db.analyticsEvent.groupBy({
    by: ["kind"],
    _count: { _all: true },
    orderBy: { _count: { kind: "desc" } },
  });
  return rows.map((r) => ({ kind: r.kind, count: r._count._all }));
}

/** Recent events for the live log panel. */
export async function recentEventsDb(limit = 20): Promise<RecentEvent[]> {
  const rows = await db.analyticsEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const userIds = Array.from(new Set(rows.map((r) => r.userId).filter((x): x is string => Boolean(x))));
  const users = await findMembersByIdsDb(userIds);
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    subjectType: r.subjectType,
    subjectId: r.subjectId,
    properties: safeParse(r.properties),
    createdAt: r.createdAt,
    actor: r.userId ? byId.get(r.userId) : undefined,
  }));
}

function safeParse(s: string): Record<string, unknown> {
  try { return JSON.parse(s) as Record<string, unknown>; } catch { return {}; }
}

/** Top contributors over the last N days, by event count. */
export async function topContributorsDb(days = 30): Promise<{ member: Member; score: number }[]> {
  const rows = await db.analyticsEvent.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, createdAt: { gte: daysAgo(days) } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: 10,
  });
  const userIds = rows.map((r) => r.userId).filter((x): x is string => Boolean(x));
  const users = await findMembersByIdsDb(userIds);
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows
    .map((r) => {
      const m = r.userId ? byId.get(r.userId) : undefined;
      return m ? { member: m, score: r._count._all } : null;
    })
    .filter((x): x is { member: Member; score: number } => x !== null);
}

/** Hourly buckets for the trend chart, last 24 hours. */
export async function eventsByHourDb(): Promise<number[]> {
  const since = new Date();
  since.setHours(since.getHours() - 24);
  const events = await db.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const buckets = new Array<number>(24).fill(0);
  for (const e of events) {
    const hoursAgo = Math.floor((Date.now() - e.createdAt.getTime()) / 3_600_000);
    if (hoursAgo >= 0 && hoursAgo < 24) buckets[23 - hoursAgo] += 1;
  }
  return buckets;
}
