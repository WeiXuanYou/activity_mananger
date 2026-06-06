/**
 * Email verification — prove the user actually owns the address they
 * typed at setup / account-settings.
 *
 * Design mirrors `recovery.ts`:
 *   - Random 32-byte hex token sent to the user; SHA-256 stored in DB.
 *   - Token is pinned to the email-at-issue so a forwarded link can't
 *     verify an unrelated later address change.
 *   - Consumption is atomic (conditional UPDATE on `usedAt: null`).
 *   - Mail is fire-and-forget at the call site (same timing-channel
 *     argument doesn't really apply here since this isn't a public
 *     endpoint, but consistency is nice).
 *
 * TTL: 24 hours. Longer than password reset because verification is a
 * convenience step, not a security race against an attacker — a user
 * who clicks the link the next morning shouldn't get a stale-link page.
 *
 * Server-only by usage. Not marked with `server-only` so seed/test
 * scripts can import it.
 */

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { PUBLIC_BASE_URL } from "@/lib/config";
import { sendEmail, renderEmailLayout, renderButton, escapeHtml } from "@/modules/mail";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function buildVerifyLink(origin: string | undefined, token: string): string {
  const base = origin || PUBLIC_BASE_URL;
  return `${base.replace(/\/$/, "")}/verify-email?token=${token}`;
}

/**
 * Issue a verification token for `userId`'s current email and send it.
 * Existing unused / expired tokens for the same user are GC'd first.
 * Caller should `void` this — it does its own logging and is safe to
 * fire-and-forget.
 */
export async function requestEmailVerification(
  userId: string,
  origin?: string,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, emailVerifiedAt: true },
  });
  // No email on file or already verified → nothing to do.
  if (!user || !user.email || user.emailVerifiedAt) return;

  await db.emailVerification.deleteMany({
    where: { userId, OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }] },
  });

  const token = randomBytes(32).toString("hex");
  await db.emailVerification.create({
    data: {
      userId,
      email: user.email,
      tokenHash: sha(token),
      expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  const link = buildVerifyLink(origin, token);
  void sendEmail({
    to: user.email,
    subject: "相聚 · 確認你的 Email",
    text: `嗨，${user.name}：

請點下面的連結確認這個 Email 是你的（24 小時內有效）：

${link}

確認完之後，未來忘記密碼或帳號時，我們才能透過這個信箱找回你。

如果不是你註冊「相聚」，這封信可以忽略。

—— 相聚 Together
`,
    html: verifyEmailHtml({ name: user.name, link }),
  }).catch((e) => console.error("[verify-email] mail failed:", e));
}

export type ConsumeVerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" | "EMAIL_CHANGED" };

/**
 * Verify a token: confirm it matches the user's current email, mark the
 * user as verified, consume the token. Atomic via conditional UPDATE.
 */
export async function consumeVerificationToken(
  rawToken: string,
): Promise<ConsumeVerifyResult> {
  const token = rawToken.trim();
  if (!token) return { ok: false, reason: "INVALID" };

  const row = await db.emailVerification.findUnique({
    where: { tokenHash: sha(token) },
  });
  if (!row) return { ok: false, reason: "INVALID" };
  if (row.usedAt) return { ok: false, reason: "USED" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };

  // The user's current email must still be the address we issued for.
  // If they changed it (or cleared it), the old token is stale.
  const user = await db.user.findUnique({
    where: { id: row.userId },
    select: { email: true, emailVerifiedAt: true },
  });
  if (!user || user.email !== row.email) {
    return { ok: false, reason: "EMAIL_CHANGED" };
  }

  return await db.$transaction(async (tx) => {
    const claim = await tx.emailVerification.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claim.count === 0) return { ok: false, reason: "USED" } as ConsumeVerifyResult;
    // Set verifiedAt only if it's still null — idempotent in the rare
    // race where two browser tabs both submit the token simultaneously.
    await tx.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    });
    // GC other tokens for this user — verified now, none of them matter.
    await tx.emailVerification.deleteMany({
      where: { userId: row.userId, id: { not: row.id } },
    });
    return { ok: true, userId: row.userId } as ConsumeVerifyResult;
  });
}

function verifyEmailHtml(p: { name: string; link: string }): string {
  const link = escapeHtml(p.link);
  return renderEmailLayout({
    title: "確認你的 Email",
    preheader: `${p.name}，請點連結確認這是你的信箱（24 小時內有效）。`,
    body: `
      <p style="margin:0 0 12px 0;">嗨，<strong>${escapeHtml(p.name)}</strong>：</p>
      <p style="margin:0 0 8px 0;">請點下面的按鈕確認這個 Email 是你的<br><strong style="color:#C75B3A;">（24 小時內有效）</strong>：</p>
      ${renderButton(p.link, "確認 Email")}
      <p style="margin:18px 0 0 0; font-size:13px; color:#6F6862;">
        如果按鈕沒反應，請複製這個連結貼到瀏覽器：<br>
        <a href="${link}" style="color:#C75B3A; word-break:break-all; text-decoration:underline;">${link}</a>
      </p>
      <p style="margin:14px 0 0 0; font-size:13px; color:#6F6862;">
        確認後，未來忘記密碼或帳號時，我們才能透過這個信箱找回你。
      </p>
      <p style="margin:14px 0 0 0; font-size:13px; color:#6F6862;">
        ⚠️ 如果你沒有註冊「相聚」，這封信可以忽略。
      </p>
    `,
  });
}
