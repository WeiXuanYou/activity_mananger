/**
 * The ONE function `core` is allowed to call inside `analytics`.
 *
 * This is the **single seam** between the social core and the analytics
 * module (see /AGENTS.md, rule 1). If this file is the only edge,
 * `analytics` can be lifted into its own service later without touching
 * any core code:
 *
 *   - Phase A (now): no-op (logs in dev only)
 *   - Phase E:       writes a row to the AnalyticsEvent table via Prisma
 *   - Phase E+:      enqueues to a background worker / external service
 *
 * Callers never need to await the return value; analytics ingestion
 * is intentionally fire-and-forget.
 */
import type { AnalyticsEventKind } from "./types";

export function emit(
  kind: AnalyticsEventKind,
  subject: { type: string; id: string },
  properties: Record<string, unknown> = {},
  userId?: string,
) {
  if (process.env.NODE_ENV !== "production") {
    // Dev visibility — keeps the seam observable without yet needing
    // a real backend. Phase E will replace this body with:
    //
    //   await db.analyticsEvent.create({
    //     data: {
    //       kind,
    //       userId,
    //       subjectType: subject.type,
    //       subjectId: subject.id,
    //       properties: JSON.stringify(properties),
    //     },
    //   });
    //
    // eslint-disable-next-line no-console
    console.debug("[analytics.emit]", { kind, subject, properties, userId });
  }
}
