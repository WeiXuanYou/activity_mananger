/**
 * The four built-in role names used across the system. These are seeded
 * into the `Role` table by `prisma/seed.ts`.
 *
 * Why a string union (not an enum)? It maps 1:1 to the `Role.name`
 * column in Prisma (which is a `String`) and avoids the runtime
 * bundle cost of TS enums. Casts from `user.role.name` (string)
 * to this union are safe because the seed enforces these values.
 *
 * If you add a new role, also update:
 *   - `prisma/seed.ts` (ROLES array)
 *   - `modules/permissions/data.ts` (ROLE_PERMISSIONS / ROLE_DESCRIPTIONS / ROLE_LABEL)
 *   - `modules/permissions/components/RoleBadge.tsx` (ROLE_STYLE)
 */
export type Role = "Guest" | "Member" | "Editor" | "Admin";
