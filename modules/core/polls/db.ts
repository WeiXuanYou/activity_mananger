/**
 * Phase C — DB-backed queries for polls.
 *
 * Adapter pulls options + nested votes + category joins in one shot, then
 * derives:
 *   - `totalVotes` = sum of votes across options
 *   - `status`     = OPEN / CLOSING_SOON (<= 3 days left) / CLOSED
 *   - `closesIn`   = human label using lib/date
 */
import { db } from "@/lib/db";
import { daysFromNow, relativeFromNow } from "@/lib/date";
import { prismaUserToMember } from "@/modules/core/members";
import { prismaCategoryToCategory } from "@/modules/core/categories";
import { visiblePollsWhere } from "@/modules/core/visibility";
import type { Poll, PollKind, PollStatus } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type CategoryRow = {
  id: string; slug: string; name: string; emoji: string; color: string;
  isDefault: boolean; createdById: string | null; description: string | null;
};

type PollRow = {
  id: string;
  question: string;
  authorId: string;
  author: UserWithRole;
  kind: string;
  multiSelect: boolean;
  anonymous: boolean;
  allowAddOption: boolean;
  closesAt: Date | null;
  hiddenAt: Date | null;
  options: {
    id: string;
    label: string;
    addedById: string | null;
    votes: { id: string }[];
  }[];
  categories: { category: CategoryRow }[];
};

function statusFor(closesAt: Date | null): PollStatus {
  if (!closesAt) return "OPEN";
  const closesIso = closesAt.toISOString().slice(0, 10);
  const days = daysFromNow(closesIso);
  if (days < 0) return "CLOSED";
  if (days <= 3) return "CLOSING_SOON";
  return "OPEN";
}

export function prismaPollToPoll(row: PollRow): Poll {
  const closesAtStr = row.closesAt
    ? row.closesAt.toISOString().slice(0, 10)
    : "（未設截止）";
  const closesIn = row.closesAt
    ? relativeFromNow(row.closesAt.toISOString().slice(0, 10))
    : "持續進行";

  return {
    id: row.id,
    question: row.question,
    authorId: row.authorId,
    author: prismaUserToMember(row.author),
    kind: (row.kind === "SCHEDULE" ? "SCHEDULE" : "STANDARD") as PollKind,
    options: row.options.map((o) => ({
      id: o.id,
      label: o.label,
      votes: o.votes.length,
      addedById: o.addedById ?? undefined,
    })),
    totalVotes: row.options.reduce((sum, o) => sum + o.votes.length, 0),
    closesAt: closesAtStr,
    closesAtIso: row.closesAt ? row.closesAt.toISOString() : null,
    closesIn,
    multiSelect: row.multiSelect,
    anonymous: row.anonymous,
    allowAddOption: row.allowAddOption,
    status: statusFor(row.closesAt),
    categoryIds: row.categories.map((c) => c.category.id),
    categories: row.categories.map((c) => prismaCategoryToCategory(c.category)),
    hiddenAt: row.hiddenAt ? row.hiddenAt.toISOString() : null,
  };
}

const POLL_INCLUDE = {
  author: { include: { role: { select: { name: true } } } },
  options: {
    orderBy: { order: "asc" as const },
    include: { votes: { select: { id: true } } },
  },
  categories: { include: { category: true } },
} as const;

export async function listPollsDb(): Promise<Poll[]> {
  const rows = await db.poll.findMany({
    where: visiblePollsWhere(),
    orderBy: { createdAt: "desc" },
    include: POLL_INCLUDE,
  });
  return rows.map(prismaPollToPoll);
}

export async function findPollDb(id: string): Promise<Poll | null> {
  const row = await db.poll.findUnique({ where: { id }, include: POLL_INCLUDE });
  return row ? prismaPollToPoll(row) : null;
}

/**
 * For a given poll + user, return which option ids the user has already voted for.
 * Used to render the checked state on the poll page.
 */
export async function findMyVotesDb(pollId: string, userId: string): Promise<string[]> {
  const rows = await db.pollVote.findMany({
    where: { userId, option: { pollId } },
    select: { optionId: true },
  });
  return rows.map((r) => r.optionId);
}

/**
 * Return the voter user ids per option for a non-anonymous poll.
 * Caller is responsible for not calling this when poll.anonymous is true.
 */
export async function listVotersByOptionDb(
  pollId: string,
): Promise<Record<string, string[]>> {
  const rows = await db.pollVote.findMany({
    where: { option: { pollId } },
    select: { optionId: true, userId: true },
  });
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    (out[r.optionId] ??= []).push(r.userId);
  }
  return out;
}
