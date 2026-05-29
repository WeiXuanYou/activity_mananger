"use server";
/**
 * Admin-only server actions and queries: invite-code generation, direct
 * role assignment, and audit-log reads. Every mutation is gated by
 * `admin.approve` (the highest-trust permission, Admin-only).
 *
 * Kept separate from actions.ts because these are operator tools, not
 * part of the normal member request flow.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { generateInviteCode } from "@/modules/auth";
import type { Role } from "@/modules/auth";
import { requirePermission } from "./guard";
import { notify } from "@/modules/notifications";

/** Generate a fresh invite code for the given default role. */
export async function generateInviteCodeAction(roleName: Role): Promise<void> {
  await requirePermission("invite.create");
  const me = await requireCurrentUser();
  await generateInviteCode({ createdById: me.id, defaultRoleName: roleName });
  revalidatePath("/app/admin");
}

/** Directly set a user's role (admin override — bypasses the request flow). */
export async function setUserRoleAction(userId: string, roleName: Role): Promise<void> {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();
  if (userId === me.id) return; // can't demote yourself by accident

  const role = await db.role.findUniqueOrThrow({ where: { name: roleName } });
  await db.user.update({ where: { id: userId }, data: { roleId: role.id } });

  void notify({
    userId,
    kind: "permission.approved",
    title: "你的角色已更新",
    body: `管理員將你的角色設為 ${roleName}。`,
    link: "/app/permissions",
  });

  revalidatePath("/app/admin");
}
