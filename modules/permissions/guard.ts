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
 * Thrown when a user who hasn't finished first-time setup tries to perform
 * a privileged action. The bootstrap admin ships as `admin`/`admin` with
 * `setupCompleted=false` and a known-weak password; the setup form forces a
 * password rotation. Without this guard that rotation was only enforced in
 * the layout's RENDER — a script could log in with the default creds and
 * call privileged server actions / API routes directly, never rotating.
 *
 * Rule: a user that already has a passwordHash but has NOT completed setup
 * is mid-rotation and must finish it before doing anything privileged.
 * (Invite-redeemed users have setupCompleted=false too, but no passwordHash
 * yet — they're allowed through; their setup is profile-only, not a
 * security rotation.)
 */
export class SetupIncompleteError extends Error {
  constructor() {
    super("Setup incomplete: finish first-time setup (and password rotation) first");
    this.name = "SetupIncompleteError";
  }
}

/** True when the user must finish setup before privileged actions. */
function mustCompleteSetup(user: { setupCompleted: boolean; passwordHash: string | null }): boolean {
  return user.passwordHash != null && !user.setupCompleted;
}

/**
 * Per-user DENY override. A row in UserPermissionGrant whose key is
 * `<permission>:deny` removes a permission the user would otherwise have
 * from their role. Used so admins can turn OFF invite.create for a
 * specific member even though Members get it by default. Admins themselves
 * can never be denied (a deny on an Admin is ignored — they manage denies).
 */
export const DENY_SUFFIX = ":deny";

async function hasDenyDb(userId: string, permission: PermissionKey): Promise<boolean> {
  const row = await db.userPermissionGrant.findUnique({
    where: { userId_permissionKey: { userId, permissionKey: `${permission}${DENY_SUFFIX}` } },
    select: { id: true },
  });
  return Boolean(row);
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
  // Bootstrap admin (or anyone shipped with a password) must finish the
  // forced first-login setup/rotation before doing ANYTHING privileged —
  // enforced here, not just in the layout render.
  if (mustCompleteSetup(user)) throw new SetupIncompleteError();
  const roleName = user.role.name as Role;
  // Admins are never subject to deny overrides. For everyone else, an
  // explicit per-user deny removes a role-granted permission.
  if (roleName !== "Admin" && (await hasDenyDb(user.id, permission))) {
    // A direct grant can still re-enable it (grant beats deny only when
    // explicitly re-granted). Otherwise the deny wins.
    if (!(await hasGrantDb(user.id, permission))) {
      throw new PermissionDeniedError(roleName, permission);
    }
  }
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
  // Mid-rotation bootstrap admin has no effective permissions until setup
  // is done — keeps UI gating consistent with requirePermission.
  if (mustCompleteSetup(user)) return false;
  const roleName = user.role.name as Role;
  // Mirror requirePermission's deny logic so UI gating matches enforcement.
  if (roleName !== "Admin" && (await hasDenyDb(user.id, permission))) {
    if (!(await hasGrantDb(user.id, permission))) return false;
  }
  if (roleHas(roleName, permission)) return true;
  return hasGrantDb(user.id, permission);
}
