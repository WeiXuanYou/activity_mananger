/**
 * DB-backed queries for the feedback module.
 *
 * Reading the list is an ADMIN capability — callers must gate on
 * `admin.approve` before calling listFeedbackDb / countOpenFeedbackDb.
 * (The action layer + the admin page both enforce this.)
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import type { Feedback, FeedbackKind, FeedbackStatus } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  avatarImage?: string | null;
  role: { name: string };
};

type FeedbackRow = {
  id: string;
  authorId: string | null;
  author: UserWithRole | null;
  kind: string;
  subject: string | null;
  body: string;
  contact: string | null;
  status: string;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

function isKind(v: string): v is FeedbackKind {
  return v === "BUG" || v === "IDEA" || v === "QUESTION" || v === "OTHER";
}

function adapt(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.author ? prismaUserToMember(row.author) : null,
    kind: isKind(row.kind) ? row.kind : "OTHER",
    subject: row.subject,
    body: row.body,
    contact: row.contact,
    status: (row.status === "RESOLVED" ? "RESOLVED" : "OPEN") as FeedbackStatus,
    resolvedById: row.resolvedById,
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

const INCLUDE = {
  author: { include: { role: { select: { name: true } } } },
} as const;

/** All feedback, newest first, OPEN before RESOLVED. Admin-only. */
export async function listFeedbackDb(): Promise<Feedback[]> {
  const rows = await db.feedback.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: INCLUDE,
  });
  return rows.map(adapt);
}

/** Count of OPEN feedback — for the admin nav badge. Admin-only. */
export async function countOpenFeedbackDb(): Promise<number> {
  return db.feedback.count({ where: { status: "OPEN" } });
}

/** A single user's own submitted feedback (so they can see their history). */
export async function listMyFeedbackDb(userId: string): Promise<Feedback[]> {
  const rows = await db.feedback.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: INCLUDE,
    take: 50,
  });
  return rows.map(adapt);
}
