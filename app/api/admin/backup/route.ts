/**
 * Admin data backup → downloads the entire database as one JSON file.
 *
 * GET /api/admin/backup → { exportedAt, counts, data: { Model: rows[] } }
 *
 * Provider-agnostic (goes through Prisma, not pg_dump/.dump), so it works
 * the same on SQLite or Postgres. Pairs conceptually with the
 * scripts/db-export-json.ts CLI, but is one click for the operator.
 *
 * Auth: `admin.approve` only. A backup contains password hashes + session
 * tokens, so it must never be reachable by non-admins.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canCurrentUser } from "@/modules/permissions";

/**
 * Parent → child order (same as scripts/db-export-json.ts). Export order
 * doesn't matter for a JSON dump, but keeping the canonical order makes the
 * file diff-friendly and mirrors the import tool's replay order.
 */
const MODELS = [
  "Role", "Permission", "RolePermission",
  "User", "Session", "PasswordReset", "EmailVerification",
  "InviteCode", "UserPermissionGrant", "PermissionRequest",
  "Category", "Post", "PostCategory",
  "Activity", "ActivityCategory", "ActivityReminder", "ActivityParticipant",
  "Lodging", "Expense",
  "Poll", "PollCategory", "PollOption", "PollVote",
  "Comment", "Reaction",
  "CustomPage", "CustomPageBlock", "CustomPageCategory",
  "Notification", "Feedback", "AnalyticsEvent",
] as const;

export async function GET() {
  if (!(await canCurrentUser("admin.approve"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const model of MODELS) {
    const delegate = (db as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[
      model[0].toLowerCase() + model.slice(1)
    ];
    // eslint-disable-next-line no-await-in-loop
    const rows = await delegate.findMany();
    data[model] = rows;
    counts[model] = rows.length;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    counts,
    data,
  };

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="together-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
