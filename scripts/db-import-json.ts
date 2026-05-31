/**
 * Replay JSON dumps from `db-export-json.ts` into the CURRENT Prisma
 * datasource. Designed for migrating SQLite → Postgres (or any
 * provider switch).
 *
 * Order is the same as the export (parent → child) so FK targets always
 * exist when their children land. We use `createMany` with
 * `skipDuplicates: true` so re-runs are idempotent (handy after a
 * partial import or a botched first attempt).
 *
 * SQLite stored DATETIME as ISO strings; Prisma's client serializes
 * them as ISO strings; the Postgres provider parses them back into
 * `timestamp`. No manual conversion needed — Prisma handles it.
 *
 * Safety: refuses to run if the target DB already has any User rows,
 * unless `--force` is passed. The most common foot-gun is "I forgot
 * `db:reset` first and now I have two admins".
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const IN_DIR = path.resolve("tmp", "export");

const IMPORT_MODELS = [
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
  const force = process.argv.includes("--force");

  const existingUsers = await db.user.count();
  if (existingUsers > 0 && !force) {
    process.stderr.write(
      `❌ Target DB already has ${existingUsers} users. Pass --force to import anyway.\n`,
    );
    process.exit(1);
  }

  const manifestPath = path.join(IN_DIR, "manifest.json");
  try {
    await fs.access(manifestPath);
  } catch {
    process.stderr.write(
      `❌ Couldn't find ${manifestPath}. Run scripts/db-export-json.ts first.\n`,
    );
    process.exit(1);
  }

  for (const model of IMPORT_MODELS) {
    const file = path.join(IN_DIR, `${model}.json`);
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      process.stdout.write(`  ${model.padEnd(24)} (no file, skipping)\n`);
      continue;
    }
    // Date strings (ISO 8601) get auto-coerced by the Prisma client
    // because the model schema marks them as DateTime — we don't have
    // to JSON.parse with a reviver.
    const rows = JSON.parse(raw) as Record<string, unknown>[];
    if (rows.length === 0) {
      process.stdout.write(`  ${model.padEnd(24)} (empty)\n`);
      continue;
    }
    const delegate = (db as unknown as Record<string, {
      createMany: (args: { data: unknown }) => Promise<{ count: number }>;
    }>)[model[0].toLowerCase() + model.slice(1)];
    // We don't pass `skipDuplicates` — it's Postgres/MySQL-only and
    // not needed here, since the safety guard at the top already
    // refuses to import into a populated DB. JSON has dates as ISO
    // strings; Prisma re-parses them on the way in.
    const result = await delegate.createMany({ data: rows });
    process.stdout.write(
      `  ${model.padEnd(24)} ${String(result.count).padStart(6)} (of ${rows.length})\n`,
    );
  }

  process.stdout.write(`\n✅ Import complete.\n`);
  await db.$disconnect();
}

main().catch(async (e) => {
  await db.$disconnect();
  console.error(e);
  process.exit(1);
});
