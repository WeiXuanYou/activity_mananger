/**
 * Dump every row in the current Prisma datasource to a directory of
 * JSON files. Provider-agnostic — works the same on SQLite or Postgres
 * because we go through the Prisma client, not via pg_dump / .dump.
 *
 * Use case: migrating from SQLite to Postgres (or back). Pair with
 * `db-import-json.ts` against the new DB.
 *
 * Output layout:
 *   tmp/export/
 *     manifest.json        { exportedAt, counts, dbProvider }
 *     Role.json            [{...}, ...]
 *     Permission.json      [...]
 *     ...                  one file per model
 *
 * Order doesn't matter for export (no FKs to satisfy). On import we'll
 * use the order in EXPORT_MODELS to honor parent → child relations.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const OUT_DIR = path.resolve("tmp", "export");

/** Parent → child order. Re-played by the import in the SAME order so
 *  FK targets exist before children reference them. Verified against
 *  `Object.keys(prismaClient)` so a name typo would have been caught
 *  the first time the script ran. Update this when adding new models. */
const EXPORT_MODELS = [
  "Role",
  "Permission",
  "RolePermission",
  "User",
  "Session",
  "PasswordReset",
  "EmailVerification",
  "InviteCode",
  "UserPermissionGrant",
  "PermissionRequest",
  "Category",
  "Post",
  "PostCategory",
  "Activity",
  "ActivityCategory",
  "ActivityReminder",
  "ActivityParticipant",
  "Lodging",
  "Expense",
  "Poll",
  "PollCategory",
  "PollOption",
  "PollVote",
  "Comment",
  "Reaction",
  "CustomPage",
  "CustomPageBlock",
  "CustomPageCategory",
  "Notification",
  "AnalyticsEvent",
] as const;

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const counts: Record<string, number> = {};
  for (const model of EXPORT_MODELS) {
    // `db[model].findMany()` requires a property lookup that bypasses
    // strict typing — every model name above is a real delegate.
    const rows = await (db as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[model[0].toLowerCase() + model.slice(1)].findMany();
    counts[model] = rows.length;
    await fs.writeFile(
      path.join(OUT_DIR, `${model}.json`),
      JSON.stringify(rows, null, 2),
      "utf8",
    );
    process.stdout.write(`  ${model.padEnd(24)} ${String(rows.length).padStart(6)}\n`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      { exportedAt: new Date().toISOString(), counts, totalRows: total },
      null,
      2,
    ),
  );
  process.stdout.write(`\n✅ Exported ${total} rows across ${EXPORT_MODELS.length} models → ${OUT_DIR}\n`);
  await db.$disconnect();
}

main().catch(async (e) => {
  await db.$disconnect();
  console.error(e);
  process.exit(1);
});
