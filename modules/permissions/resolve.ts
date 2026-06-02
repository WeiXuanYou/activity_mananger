/**
 * PURE permission-decision logic — no I/O, no DB, no server-only imports.
 *
 * Kept separate from guard.ts (which is server-only because it touches the
 * session + DB) so this can be unit-tested and imported anywhere.
 */
import type { Role } from "@/modules/auth";
import type { PermissionKey } from "./types";
import { ROLE_PERMISSIONS } from "./data";

/** Suffix that marks a per-user DENY override row in UserPermissionGrant. */
export const DENY_SUFFIX = ":deny";

/** Pure check: does the given role hold the given permission? */
export function roleHas(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Does a user effectively hold `permission`, given the three inputs that
 * matter? Single source of truth shared by requirePermission /
 * canCurrentUser (guard.ts) so enforcement and UI gating can't drift.
 *
 * Rules:
 *   - An explicit grant always wins (re-enables even a denied permission).
 *   - Admins are never denied (they manage denies).
 *   - Otherwise a deny removes a role-granted permission.
 *   - Without grant/deny, the role matrix decides.
 */
export function resolvePermission(input: {
  role: Role;
  permission: PermissionKey;
  hasGrant: boolean;
  hasDeny: boolean;
}): boolean {
  const { role, permission, hasGrant, hasDeny } = input;
  if (hasGrant) return true;
  if (role !== "Admin" && hasDeny) return false;
  return roleHas(role, permission);
}
