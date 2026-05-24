import type { AnalyticsEventKind } from "./types";

/**
 * The ONE function `core` may call into `analytics` with.
 * Phase A: no-op (logs in dev).
 * Phase B+: inserts an AnalyticsEvent row.
 *
 * If this file is the only edge between `core` and `analytics`,
 * the analytics module can be lifted into its own service
 * without touching `core`.
 */
export function emit(
  kind: AnalyticsEventKind,
  subject: { type: string; id: string },
  properties: Record<string, unknown> = {},
  userId?: string,
) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics.emit]", { kind, subject, properties, userId });
  }
}
