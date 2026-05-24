import type { Role } from "@/modules/auth";

export type PermissionKey =
  | "post.create"
  | "post.pin"
  | "activity.create"
  | "poll.create"
  | "comment.create"
  | "comment.moderate"
  | "page.create"
  | "page.publish"
  | "category.create"
  | "invite.create"
  | "admin.approve"
  | "analytics.view";

export type PermissionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PermissionRequest = {
  id: string;
  userId: string;
  currentRole: Role;
  requestedRole: Role;
  reason: string;
  status: PermissionRequestStatus;
  createdAt: string;
  decidedById?: string;
};
