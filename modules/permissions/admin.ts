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

/** The bootstrap admin's handle is hardcoded and protected from deletion
 *  / demotion / renaming. Without this, a careless admin could lock the
 *  whole install out of its only super-user. Kept inline as the literal
 *  "admin" because a `"use server"` file can only export async functions
 *  — and a brand-new clone never has to migrate this way.
 *
 *  Same string is hardcoded in `modules/auth/actions.ts`'s
 *  `enforceBootstrapAdminHandle`. Cheaper than introducing a shared
 *  non-"use server" constants module for one string. */
async function isBootstrapAdmin(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { handle: true },
  });
  return u?.handle === "admin";
}

/** Generate a fresh invite code for the given default role. Gate is
 *  `invite.create` — Admin / Editor get it by role, and individual
 *  Guest/Member users can be granted it via the UserPermissionGrant
 *  table by an admin. */
export async function generateInviteCodeAction(roleName: Role): Promise<void> {
  await requirePermission("invite.create");
  const me = await requireCurrentUser();
  // Non-admins can't generate Admin invites — would be a privilege
  // escalation vector. They CAN generate Editor/Member/Guest.
  if (roleName === "Admin") {
    await requirePermission("admin.approve");
  }
  await generateInviteCode({ createdById: me.id, defaultRoleName: roleName });
  revalidatePath("/app/admin");
  revalidatePath("/app/invites");
}

/** Directly set a user's role (admin override — bypasses the request flow). */
export async function setUserRoleAction(userId: string, roleName: Role): Promise<void> {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();
  if (userId === me.id) return; // can't demote yourself by accident

  // The bootstrap admin can never be demoted below Admin. The whole
  // point of the protected handle is "there's always a super-user".
  if (roleName !== "Admin" && (await isBootstrapAdmin(userId))) {
    throw new Error("admin 帳號不能降權，請保留為管理員");
  }

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

/**
 * Permanently remove a user AND everything they authored.
 *
 * We do this in a transaction because the schema mixes two relation
 * styles:
 *   - Real FKs with onDelete: Cascade — User.sessions / .votes / .rsvps
 *     / .notifications / .permissionGrants / .lodgings — these go
 *     automatically when the user row is deleted.
 *   - Polymorphic (parentType + parentId) — Comment and Reaction — and
 *     non-cascading FKs (Post, Activity, Poll, CustomPage, InviteCode,
 *     PermissionRequest) — we wipe these manually below.
 *
 * Self-deletion is blocked: the last admin removing themselves would
 * lock the install out.
 */
export async function deleteUserAction(userId: string): Promise<void> {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();
  if (userId === me.id) {
    throw new Error("不能刪除自己的帳號");
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, handle: true },
  });
  if (!target) return;

  // The bootstrap admin row is non-deletable. If the operator really
  // wants to retire it they can demote a different account up to Admin
  // first — but the `admin` handle itself stays around as a safety net.
  if (target.handle === "admin") {
    throw new Error("admin 帳號不能刪除（系統保留帳號）");
  }

  // Gather all content ids the user owns — we need them to clean up
  // the polymorphic comment / reaction tables (no FK from parentId).
  const [posts, activities, polls, pages] = await Promise.all([
    db.post.findMany({ where: { authorId: userId }, select: { id: true } }),
    db.activity.findMany({ where: { authorId: userId }, select: { id: true } }),
    db.poll.findMany({ where: { authorId: userId }, select: { id: true } }),
    db.customPage.findMany({ where: { ownerId: userId }, select: { id: true } }),
  ]);
  const postIds = posts.map((x) => x.id);
  const activityIds = activities.map((x) => x.id);
  const pollIds = polls.map((x) => x.id);
  const pageIds = pages.map((x) => x.id);

  // Comments under the user's content can also have replies under THEM
  // (threaded). Pull every comment that lives under the user's content
  // OR was authored by them, so we can delete replies first.
  const allComments = await db.comment.findMany({
    where: {
      OR: [
        { authorId: userId },
        { parentType: "POST", parentId: { in: postIds } },
        { parentType: "ACTIVITY", parentId: { in: activityIds } },
        { parentType: "PAGE", parentId: { in: pageIds } },
        // POLL comments aren't currently used but include for safety
        { parentType: "POLL", parentId: { in: pollIds } },
      ],
    },
    select: { id: true },
  });
  const commentIds = allComments.map((x) => x.id);

  await db.$transaction(async (tx) => {
    // 1. Reactions on the user's content + by the user
    await tx.reaction.deleteMany({
      where: {
        OR: [
          { userId },
          { parentType: "POST", parentId: { in: postIds } },
          { parentType: "ACTIVITY", parentId: { in: activityIds } },
          { parentType: "POLL", parentId: { in: pollIds } },
          { parentType: "PAGE", parentId: { in: pageIds } },
          { parentType: "COMMENT", parentId: { in: commentIds } },
        ],
      },
    });

    // 2. Comments — delete replies first to satisfy the self-relation
    //    constraint (parentCommentId references Comment.id with NoAction).
    if (commentIds.length > 0) {
      await tx.comment.deleteMany({ where: { parentCommentId: { in: commentIds } } });
      await tx.comment.deleteMany({ where: { id: { in: commentIds } } });
    }

    // 3. Decided/audit fields that reference this user — NULL them out
    //    so the audit log survives but doesn't break the delete.
    await tx.permissionRequest.updateMany({
      where: { decidedById: userId },
      data: { decidedById: null },
    });
    await tx.post.updateMany({ where: { pinnedById: userId }, data: { pinnedById: null } });
    await tx.category.updateMany({ where: { createdById: userId }, data: { createdById: null } });
    await tx.pollOption.updateMany({ where: { addedById: userId }, data: { addedById: null } });

    // 4. Permission requests the user MADE — no nullable FK, delete them.
    await tx.permissionRequest.deleteMany({ where: { userId } });

    // 5. Invite codes the user issued — delete unused ones; used ones
    //    cleared via `usedById` cascade when we delete the user.
    await tx.inviteCode.deleteMany({ where: { createdById: userId } });

    // 6. The user's own content. Order matters where there's no cascade.
    if (postIds.length > 0)     await tx.post.deleteMany({ where: { id: { in: postIds } } });
    if (activityIds.length > 0) await tx.activity.deleteMany({ where: { id: { in: activityIds } } });
    if (pollIds.length > 0)     await tx.poll.deleteMany({ where: { id: { in: pollIds } } });
    if (pageIds.length > 0)     await tx.customPage.deleteMany({ where: { id: { in: pageIds } } });

    // 7. Finally the user — sessions / votes / rsvps / notifications /
    //    permission grants / lodgings cascade automatically.
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/app/admin");
  revalidatePath("/app/feed");
  revalidatePath("/app/activities");
}
