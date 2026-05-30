import type { Role } from "@/modules/auth";

/**
 * Fine-grained permission keys. Convention: `<resource>.<verb>`.
 *
 * These keys map to:
 *   - `Permission.key` rows in DB (seeded from PERMISSIONS_BY_ROLE in
 *     prisma/seed.ts)
 *   - `RolePermission` join rows (the actual matrix)
 *
 * Adding a new key requires updating:
 *   1. This union
 *   2. ROLE_PERMISSIONS in ./data.ts
 *   3. PERMISSIONS_BY_ROLE in prisma/seed.ts
 *   4. Run `npm run db:seed`
 */
export type PermissionKey =
  | "post.create"
  | "post.pin"
  | "post.moderate"      // edit/delete others' posts (owner can always edit own)
  | "activity.create"
  | "activity.moderate"  // edit/delete others' activities
  | "poll.create"
  | "poll.moderate"      // edit/delete others' polls
  | "comment.create"
  | "comment.moderate"
  | "page.create"
  | "page.publish"
  | "category.create"
  | "invite.create"
  | "admin.approve"
  | "analytics.view";

/** Lifecycle of a role-upgrade request. `PENDING` → admin decision. */
export type PermissionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * A request from a member to be promoted to a higher role.
 * Audit trail is permanent — rows are never deleted, only updated
 * to `APPROVED` / `REJECTED` with `decidedById` + `decidedAt`.
 */
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
