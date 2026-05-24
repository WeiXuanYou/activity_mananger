import type { Role } from "@/modules/auth";
import type { PermissionKey } from "./types";
import { ROLE_PERMISSIONS } from "./data";

/**
 * Pure check — does this role hold this permission?
 */
export function roleHas(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * SERVER-SIDE chokepoint for mutations and non-public reads.
 *
 * Phase A: throws on missing permission (stub — no real session).
 * Phase B: reads the session via getCurrentUser(), then throws a
 *          typed error caught by the route's error boundary.
 *
 * This is the SINGLE seam where every protected action passes.
 */
export function requirePermission(role: Role, permission: PermissionKey): void {
  if (!roleHas(role, permission)) {
    throw new Error(`Permission denied: ${role} cannot ${permission}`);
  }
}
