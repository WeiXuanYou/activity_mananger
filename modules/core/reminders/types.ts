/**
 * Two reminder tiers. Adding a new one (e.g. "WEEK_BEFORE") only needs:
 *   1. Append the literal here
 *   2. Add a TIER_CONFIG entry in db.ts
 *   3. Run `npm run db:seed` — no schema change since tier is a string column
 */
export type ReminderTier = "DAY_BEFORE" | "HOUR_BEFORE";

export type ReminderRunResult = {
  scannedActivities: number;
  remindersSent: number;
  notificationsCreated: number;
  /** Per-activity breakdown for the admin "last run" panel. */
  details: {
    activityId: string;
    activityTitle: string;
    tier: ReminderTier;
    userCount: number;
  }[];
};
