/**
 * Phase C — DB-backed queries for activities.
 *
 * Adapter: Prisma rows include nested `participants` (RSVP rows) and
 * `categories` (join rows). We flatten into the slim `Activity` shape:
 *   - `rsvp` counts derived from the participants list
 *   - `categoryIds` derived from the join rows
 *   - `startsAt` serialised back to "YYYY-MM-DD HH:mm" for compatibility
 *     with the existing `lib/date.ts` parsers
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import { prismaCategoryToCategory } from "@/modules/core/categories";
import type { Activity } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type CategoryRow = {
  id: string; slug: string; name: string; emoji: string; color: string;
  isDefault: boolean; createdById: string | null; description: string | null;
};

type ActivityRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  cover: string;
  startsAt: Date;
  authorId: string;
  author: UserWithRole;
  participants: { status: string }[];
  categories: { category: CategoryRow }[];
};

function formatDateForUi(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function prismaActivityToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    cover: row.cover,
    startsAt: formatDateForUi(row.startsAt),
    hostId: row.authorId,
    host: prismaUserToMember(row.author),
    rsvp: {
      going: row.participants.filter((p) => p.status === "GOING").length,
      maybe: row.participants.filter((p) => p.status === "MAYBE").length,
      declined: row.participants.filter((p) => p.status === "DECLINED").length,
    },
    categoryIds: row.categories.map((c) => c.category.id),
    categories: row.categories.map((c) => prismaCategoryToCategory(c.category)),
  };
}

const ACTIVITY_INCLUDE = {
  author: { include: { role: { select: { name: true } } } },
  participants: { select: { status: true } },
  categories: { include: { category: true } },
} as const;

export async function listActivitiesDb(): Promise<Activity[]> {
  const rows = await db.activity.findMany({
    orderBy: { startsAt: "asc" },
    include: ACTIVITY_INCLUDE,
  });
  return rows.map(prismaActivityToActivity);
}

export async function listUpcomingActivitiesDb(): Promise<Activity[]> {
  const rows = await db.activity.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: ACTIVITY_INCLUDE,
  });
  return rows.map(prismaActivityToActivity);
}

export async function listPastActivitiesDb(): Promise<Activity[]> {
  const rows = await db.activity.findMany({
    where: { startsAt: { lt: new Date() } },
    orderBy: { startsAt: "desc" },
    include: ACTIVITY_INCLUDE,
  });
  return rows.map(prismaActivityToActivity);
}

export async function findActivityDb(id: string): Promise<Activity | null> {
  const row = await db.activity.findUnique({
    where: { id },
    include: ACTIVITY_INCLUDE,
  });
  return row ? prismaActivityToActivity(row) : null;
}

export async function findNextActivityDb(): Promise<Activity | null> {
  const row = await db.activity.findFirst({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    include: ACTIVITY_INCLUDE,
  });
  return row ? prismaActivityToActivity(row) : null;
}

/** Return the current user's RSVP status for an activity, or null. */
export async function findMyRsvpDb(
  activityId: string,
  userId: string,
): Promise<"GOING" | "MAYBE" | "DECLINED" | null> {
  const row = await db.activityParticipant.findUnique({
    where: { activityId_userId: { activityId, userId } },
    select: { status: true },
  });
  return row ? (row.status as "GOING" | "MAYBE" | "DECLINED") : null;
}
