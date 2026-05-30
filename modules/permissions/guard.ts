/**
 * Permission guard — the SINGLE seam where every protected action passes.
 *
 * Architectural promise (see /AGENTS.md, rule 3):
 *   "Every mutating server action MUST start with `await requirePermission(...)`."
 *
 * If this rule is followed religiously, the whole app's security model
 * reduces to: "is the role → permission matrix in `data.ts` correct?"
 *
 * Three flavours:
 *   - `requirePermission(key)`  → async, throws on deny      (use in server actions)
 *   - `canCurrentUser(key)`     → async, returns boolean      (use in server components for UI gating)
 *   - `roleHas(role, key)`      → sync, pure function         (use when role already known)
 */
import type { Role } from "@/modules/auth";
import { getCurrentUser, requireCurrentUser } from "@/modules/auth";
import { db } from "@/lib/db";
import type { PermissionKey } from "./types";
import { ROLE_PERMISSIONS } from "./data";

/**
 * Pure check: does the given role hold the given permission?
 * No I/O, no async. Cheap.
 */
export function roleHas(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Has this user been GRANTED this permission directly by an admin (on
 * top of what their role gives)? Used by canCurrentUser /
 * requirePermission to extend the role matrix with per-user grants
 * (typically `invite.create`).
 */
async function hasGrantDb(userId: string, permission: PermissionKey): Promise<boolean> {
  const row = await db.userPermissionGrant.findUnique({
    where: { userId_permissionKey: { userId, permissionKey: permission } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Thrown by {@link requirePermission} when the current user's role
 * lacks the requested permission. Routes' `error.tsx` boundaries can
 * catch this and show a friendly 403 page.
 */
export class PermissionDeniedError extends Error {
  constructor(role: Role, permission: PermissionKey) {
    super(`Permission denied: ${role} cannot ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * SERVER-SIDE chokepoint. Call this at the TOP of every server action
 * and every server-component page that reads non-public data.
 *
 * Behavior:
 *   1. Resolves the current user via session cookie (throws if unauthenticated).
 *   2. Compares role → permission matrix.
 *   3. Throws {@link PermissionDeniedError} if missing.
 *
 * If you find yourself wanting to skip this for performance, you almost
 * always want `canCurrentUser` instead — same lookup but returns boolean.
 */
export async function requirePermission(permission: PermissionKey): Promise<void> {
  const user = await requireCurrentUser();
  const roleName = user.role.name as Role;
  if (roleHas(roleName, permission)) return;
  if (await hasGrantDb(user.id, permission)) return;
  throw new PermissionDeniedError(roleName, permission);
}

/**
 * Boolean variant — returns `false` (never throws) when the user isn't
 * signed in or lacks the permission. Ideal for UI gating:
 *
 *   const canPin = await canCurrentUser("post.pin");
 *   {canPin && <PinButton/>}
 */
export async function canCurrentUser(permission: PermissionKey): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (roleHas(user.role.name as Role, permission)) return true;
  return hasGrantDb(user.id, permission);
}
