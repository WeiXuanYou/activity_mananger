"use server";
/**
 * Server actions for permission management.
 *
 * Notes:
 *   - Submitting a request is open to any signed-in user (no permission
 *     key needed — that's the whole point of "I want a permission I don't have").
 *   - Approving / rejecting is gated by `admin.approve`.
 *   - Audit trail is permanent: rows are NEVER deleted; status updates
 *     are recorded with `decidedById` + `decidedAt`.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import type { Role } from "@/modules/auth";
import { requirePermission } from "./guard";
import { emit } from "@/modules/analytics";
import { notify } from "@/modules/notifications";

export type RequestState = { error?: string; success?: boolean };

/**
 * Submit a role-upgrade request.
 * Form-action-shaped so the page can use `useActionState`.
 */
export async function submitPermissionRequestAction(
  _prev: RequestState | undefined,
  formData: FormData,
): Promise<RequestState> {
  const me = await requireCurrentUser();
  const targetRoleName = String(formData.get("requestedRole") ?? "") as Role;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) return { error: "請寫一下申請理由" };
  if (!["Member", "Editor", "Admin"].includes(targetRoleName)) {
    return { error: "目標角色不正確" };
  }

  const targetRole = await db.role.findUnique({ where: { name: targetRoleName } });
  if (!targetRole) return { error: "找不到目標角色" };

  // Don't allow requesting same-or-lower (Phase C heuristic; later we'd
  // compare levels properly)
  if (targetRoleName === (me.role.name as Role)) {
    return { error: "你已經是這個角色了" };
  }

  await db.permissionRequest.create({
    data: {
      userId: me.id,
      currentRoleId: me.roleId,
      requestedRoleId: targetRole.id,
      reason,
      status: "PENDING",
    },
  });

  void emit("permission.requested", { type: "user", id: me.id }, { from: me.role.name, to: targetRoleName }, me.id);

  revalidatePath("/app/permissions");
  return { success: true };
}

/** Admin: approve a request. Updates the user's role and stamps the audit row. */
export async function approveRequestAction(requestId: string) {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();

  const req = await db.permissionRequest.findUnique({
    where: { id: requestId },
    include: { requestedRole: true },
  });
  if (!req || req.status !== "PENDING") return;

  await db.$transaction([
    db.user.update({
      where: { id: req.userId },
      data: { roleId: req.requestedRoleId },
    }),
    db.permissionRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", decidedById: me.id, decidedAt: new Date() },
    }),
  ]);

  // Tell the requester their request went through
  void notify({
    userId: req.userId,
    kind: "permission.approved",
    title: "權限申請已核准 🎉",
    body: `你已升級為 ${req.requestedRole.name}！現在可以使用更多功能了。`,
    link: "/app/permissions",
  });

  revalidatePath("/app/permissions");
}

/** Admin: reject a request — leaves the user's role untouched. */
export async function rejectRequestAction(requestId: string) {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();

  // Guard existence + state first (mirrors approveRequestAction), so a stale
  // or double-clicked request id is a no-op rather than a thrown P2025.
  const existing = await db.permissionRequest.findUnique({
    where: { id: requestId },
    include: { requestedRole: true },
  });
  if (!existing || existing.status !== "PENDING") return;

  await db.permissionRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", decidedById: me.id, decidedAt: new Date() },
  });

  void notify({
    userId: existing.userId,
    kind: "permission.rejected",
    title: "權限申請未通過",
    body: `這次申請 ${existing.requestedRole.name} 未通過。如有疑問可以再聯絡管理員。`,
    link: "/app/permissions",
  });

  revalidatePath("/app/permissions");
}
