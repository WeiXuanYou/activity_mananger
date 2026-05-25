import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

export type InviteRedeemResult =
  | { ok: true; userId: string; isNewUser: boolean }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" };

/**
 * Redeem an invite code. If the code is unused, a new User is created with
 * the code's default role and the code is marked used by that user.
 *
 * Phase B: a one-shot demo flow — codes map to a pre-created handle so the
 * same code re-used signs you back in as that user. Phase C will collect
 * name/handle on first redemption.
 */
export async function redeemInvite(rawCode: string): Promise<InviteRedeemResult> {
  const code = rawCode.trim();
  if (!code) return { ok: false, reason: "INVALID" };

  const invite = await db.inviteCode.findUnique({
    where: { code },
    include: { defaultRole: true, usedBy: true, createdBy: true },
  });
  if (!invite) return { ok: false, reason: "INVALID" };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };

  // Demo behavior: if the code already redeemed, sign back in as that user.
  if (invite.usedById && invite.usedBy) {
    return { ok: true, userId: invite.usedById, isNewUser: false };
  }

  // Create a new user, mark the code used.
  const suffix = randomBytes(2).toString("hex");
  const handle = `guest-${suffix}`;
  const palette = ["#C75B3A", "#7A8E6E", "#D4A574", "#8FA7B7", "#B58FBF", "#D98090"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  const user = await db.user.create({
    data: {
      handle,
      name: `新${invite.defaultRole.name}`,
      avatarColor: color,
      initial: "新",
      roleId: invite.defaultRoleId,
    },
  });
  await db.inviteCode.update({
    where: { id: invite.id },
    data: { usedById: user.id },
  });

  return { ok: true, userId: user.id, isNewUser: true };
}

export async function generateInviteCode(opts: {
  createdById: string;
  defaultRoleName: "Guest" | "Member" | "Editor" | "Admin";
}): Promise<string> {
  const role = await db.role.findUniqueOrThrow({ where: { name: opts.defaultRoleName } });
  const code = `TOGETHER-${randomBytes(3).toString("hex").toUpperCase()}`;
  await db.inviteCode.create({
    data: { code, createdById: opts.createdById, defaultRoleId: role.id },
  });
  return code;
}
