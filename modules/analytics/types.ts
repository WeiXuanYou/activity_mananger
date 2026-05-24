export type AnalyticsEventKind =
  | "vote.cast"
  | "activity.rsvp"
  | "post.created"
  | "post.viewed"
  | "page.viewed"
  | "permission.requested";

export type AnalyticsEvent = {
  id: string;
  kind: AnalyticsEventKind;
  userId?: string;
  subjectType: string;
  subjectId: string;
  properties: Record<string, unknown>;
  createdAt: string;
};
