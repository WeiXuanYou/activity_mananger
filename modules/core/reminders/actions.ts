"use server";
/**
 * Admin-triggered "run reminders now" action. The cron route handler
 * (`/api/cron/reminders`) calls the underlying `runActivityReminders`
 * directly with a different auth path (shared-secret bearer token).
 */
import { requirePermission } from "@/modules/permissions";
import { runActivityReminders } from "./db";
import type { ReminderRunResult } from "./types";

export async function runRemindersAdminAction(): Promise<ReminderRunResult> {
  await requirePermission("admin.approve");
  return runActivityReminders();
}
