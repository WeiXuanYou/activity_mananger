import type { Role } from "@/modules/auth";
import { getCurrentUser, requireCurrentUser } from "@/modules/auth";
import type { PermissionKey } from "./types";
import { ROLE_PERMISSIONS } from "./data";

/** Pure check — does this role hold this permission? */
export function roleHas(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class PermissionDeniedError extends Error {
  constructor(role: Role, permission: PermissionKey) {
    super(`Permission denied: ${role} cannot ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * SERVER-SIDE chokepoint for mutations and non-public reads.
 *
 * Phase B+: reads the real session via getCurrentUser(), throws
 * PermissionDeniedError if the current user's role lacks the permission.
 * Use at the top of every server action.
 *
 * This is the SINGLE seam where every protected action passes.
 */
export async function requirePermission(permission: PermissionKey): Promise<void> {
  const user = await requireCurrentUser();
  const roleName = user.role.name as Role;
  if (!roleHas(roleName, permission)) {
    throw new PermissionDeniedError(roleName, permission);
  }
}

/** Convenience — boolean version, doesn't throw. */
export async function canCurrentUser(permission: PermissionKey): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roleHas(user.role.name as Role, permission);
}
