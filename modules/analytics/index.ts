export type { AnalyticsEvent, AnalyticsEventKind } from "./types";

// The single ingestion seam
export { emit } from "./ingest";

// Phase A — mock dashboard data (kept for /mockup/analytics)
export {
  kpis,
  trendWeeks,
  topMembers,
  topPosts,
  votingPatterns,
  categoryDistribution,
} from "./queries";

// Phase E — real DB-backed queries
export type { AnalyticsKpi, RecentEvent } from "./db";
export {
  computeKpisDb,
  eventsByKindDb,
  recentEventsDb,
  topContributorsDb,
  eventsByHourDb,
} from "./db";

// UI
export { KpiCard } from "./components/KpiCard";
export { TrendChart } from "./components/TrendChart";
