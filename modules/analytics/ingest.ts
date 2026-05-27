/**
 * The ONE function `core` calls into `analytics`.
 *
 * This is the single seam between the social core and the analytics
 * module (see /AGENTS.md, rule 1). If this file is the only edge,
 * `analytics` can be lifted into its own service later without touching
 * any core code:
 *
 *   - Phase A:  no-op (dev log)
 *   - Phase E:  ✅ writes a row to the AnalyticsEvent table via Prisma
 *   - Phase E+: enqueue to a background worker / external service
 *
 * **Fire-and-forget.** Callers don't need to await — failures are
 * swallowed so an analytics outage never breaks the main action.
 * If you do `await emit(...)`, the promise resolves to void either way.
 */
import { db } from "@/lib/db";
import type { AnalyticsEventKind } from "./types";

export async function emit(
  kind: AnalyticsEventKind,
  subject: { type: string; id: string },
  properties: Record<string, unknown> = {},
  userId?: string,
): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        kind,
        userId: userId ?? null,
        subjectType: subject.type,
        subjectId: subject.id,
        properties: JSON.stringify(properties),
      },
    });
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics.emit]", kind, subject);
    }
  } catch (err) {
    // Never let analytics failures break the main flow
    // eslint-disable-next-line no-console
    console.error("[analytics.emit] failed", { kind, err });
  }
}
