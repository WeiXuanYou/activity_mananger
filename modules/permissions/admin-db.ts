/**
 * Admin-panel read queries. Read-only; the admin page already gates on
 * `admin.approve` before calling these.
 */
import { db } from "@/lib/db";
import type { Member } from "@/modules/core/members";
import { prismaUserToMember } from "@/modules/core/members";

export type InviteCodeRow = {
  code: string;
  roleName: string;
  used: boolean;
  usedByName?: string;
  createdAt: Date;
};

export async function listInviteCodesDb(): Promise<InviteCodeRow[]> {
  const rows = await db.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { defaultRole: { select: { name: true } }, usedBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    code: r.code,
    roleName: r.defaultRole.name,
    used: Boolean(r.usedById),
    usedByName: r.usedBy?.name,
    createdAt: r.createdAt,
  }));
}

/** All members with their roles — for the role-management table. */
export async function listAllMembersDb(): Promise<Member[]> {
  const rows = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { role: true },
  });
  return rows.map(prismaUserToMember);
}
