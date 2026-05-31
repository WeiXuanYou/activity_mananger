import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { AVATAR_PALETTE } from "./validation";

export type InviteRedeemResult =
  | { ok: true; userId: string; isNewUser: boolean }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" };

/**
 * Redeem an invite code.
 *
 * Two flavours:
 *   - reusable=true  (demo seed only): re-logs-in as the original redeemer
 *     so /preview-style demos stay shareable.
 *   - reusable=false (production default): one-shot — second person trying
 *     the same code gets USED.
 *
 * New users start with `setupCompleted=false`. The login redirect handler
 * sends them to /app/setup to pick their name / handle / avatar before
 * landing in the feed.
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

  if (invite.usedById && invite.usedBy) {
    if (invite.reusable) {
      // Demo / re-share code — sign back in as the original redeemer.
      return { ok: true, userId: invite.usedById, isNewUser: false };
    }
    return { ok: false, reason: "USED" };
  }

  // Create the new user, then ATOMICALLY claim the code. We can't claim
  // first because usedById is a FK to a real user — so we create, then
  // race to claim with a conditional update (usedById still null). If we
  // lose the race, another request already redeemed it: delete our orphan
  // user and sign in as the winner instead.
  const suffix = randomBytes(2).toString("hex");
  const handle = `new-${suffix}`;
  const color = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];

  const user = await db.user.create({
    data: {
      handle,
      name: `新成員`,
      avatarColor: color,
      initial: "新",
      roleId: invite.defaultRoleId,
      setupCompleted: false, // route them through /app/setup on first login
    },
  });

  // Atomic compare-and-set: only succeeds if usedById is still null.
  const claim = await db.inviteCode.updateMany({
    where: { id: invite.id, usedById: null },
    data: { usedById: user.id },
  });

  if (claim.count === 0) {
    // We lost the race. Roll back our orphan user and use the winner.
    await db.user.delete({ where: { id: user.id } }).catch(() => {});
    const winner = await db.inviteCode.findUnique({
      where: { id: invite.id },
      select: { usedById: true, reusable: true },
    });
    if (winner?.usedById && winner.reusable) {
      return { ok: true, userId: winner.usedById, isNewUser: false };
    }
    return { ok: false, reason: "USED" };
  }

  return { ok: true, userId: user.id, isNewUser: true };
}

export async function generateInviteCode(opts: {
  createdById: string;
  defaultRoleName: "Guest" | "Member" | "Editor" | "Admin";
  reusable?: boolean;
}): Promise<string> {
  const role = await db.role.findUniqueOrThrow({ where: { name: opts.defaultRoleName } });
  const code = `TOGETHER-${randomBytes(3).toString("hex").toUpperCase()}`;
  await db.inviteCode.create({
    data: {
      code,
      createdById: opts.createdById,
      defaultRoleId: role.id,
      reusable: opts.reusable ?? false,
    },
  });
  return code;
}
