/**
 * In-app notification kinds. The product is public-only (no DMs), so
 * notifications are the one-way "something happened that concerns you"
 * channel: a permission decision, an RSVP to your activity, your post
 * being pinned, etc.
 */
export type NotificationKind =
  | "permission.approved"
  | "permission.rejected"
  | "activity.rsvp"
  | "post.pinned"
  | "feedback.received"
  | "mention"
  | "welcome";

export type Notification = {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string; // relative time for UI
};
