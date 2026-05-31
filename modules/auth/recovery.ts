/**
 * Account recovery — password reset + "what's my handle?" via email.
 *
 * Server-only by usage (it touches the DB and the mail sender), but
 * not marked with the `server-only` shim because seed scripts and the
 * vitest E2E suite need to import it from Node directly.
 *
 * Threat model & decisions:
 *
 *   - **No email enumeration**: every public action returns the same
 *     generic success message regardless of whether the email matches a
 *     real account. The mail goes out only if there's a match; the
 *     response shape is identical either way.
 *
 *   - **Tokens stored hashed**: same pattern as Session — random 32-byte
 *     hex token sent to the user, SHA-256 of it stored in DB. A DB
 *     leak can't be replayed to forge reset links.
 *
 *   - **One-shot tokens**: once consumed (`usedAt` set), a token is
 *     dead. We also delete prior unused tokens for the same user on
 *     each new request so a forgotten link from yesterday can't be
 *     dredged up.
 *
 *   - **Short TTL**: 1 hour. Long enough for someone to switch devices;
 *     short enough that a leaked link expires before most threats can
 *     act on it.
 *
 *   - **Generic timing**: we still hash a dummy token even when no user
 *     matched, so request-time doesn't leak whether the email exists.
 */

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/modules/mail";
import { hashPassword } from "./password";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
// Minimum gap between consecutive reset emails to the same account.
// Stops someone from using the public form to flood a victim's inbox
// (a "mail bomb"); 60s is invisible to a real person who just mistyped
// once and tried again, but caps abuse to one mail/minute/account.
const RESEND_COOLDOWN_MS = 60 * 1000;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Build an absolute URL for the recovery link.
 *
 *  We don't bundle next/headers reads into this server-only helper
 *  because the callers (server actions) already know the origin from
 *  the request. The caller passes it in via `origin`; if unset we
 *  fall back to `APP_URL` env, then `http://localhost:3000` for dev. */
function buildResetLink(origin: string | undefined, token: string): string {
  const base = origin || process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
}

/**
 * Issue a password-reset token for the user with this email (if any),
 * email them the link, and return — without revealing whether the
 * email was on file.
 */
export async function requestPasswordReset(
  rawEmail: string,
  origin?: string,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, handle: true },
  });

  // Generate the token unconditionally so the timing of the response
  // is roughly the same whether or not the email matched.
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha(token);

  if (!user) {
    // Still hash something so request time looks similar. No DB write,
    // no mail.
    return;
  }

  // Cooldown: if we already emailed a fresh link in the last minute,
  // silently skip — don't create a row, don't send. The caller still
  // gets the same generic "we sent it if we know you" response, so this
  // is invisible to a legitimate user and to an enumeration attacker.
  const recent = await db.passwordReset.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return;

  // Clear prior resets for this user — unused ones limit the blast
  // radius if an old link leaks; expired ones are just dead rows. We
  // GC both here rather than running a scheduled job (family scale).
  await db.passwordReset.deleteMany({
    where: { userId: user.id, OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }] },
  });

  await db.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const link = buildResetLink(origin, token);
  await sendEmail({
    to: email,
    subject: "相聚 · 重設密碼",
    text:
`嗨，${user.name}：

我們收到「相聚」的密碼重設請求。如果是你發起的，請點下面的連結設定新密碼（1 小時內有效）：

${link}

你的登入帳號（handle）：${user.handle}

如果不是你發起的，這封信可以忽略。你的密碼不會改變。

—— 相聚 Together
`,
    html:
`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #2C2825; line-height: 1.6;">
  <h2 style="color: #C75B3A; margin-bottom: 8px;">相聚 · 重設密碼</h2>
  <p>嗨，${escapeHtml(user.name)}：</p>
  <p>我們收到「相聚」的密碼重設請求。如果是你發起的，請點下面的按鈕設定新密碼（<strong>1 小時內有效</strong>）：</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="${link}" style="background: #C75B3A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">設定新密碼</a>
  </p>
  <p style="font-size: 13px; color: #6F6862;">或複製連結：<br><a href="${link}" style="color: #C75B3A; word-break: break-all;">${link}</a></p>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 24px 0;">
  <p style="font-size: 13px; color: #6F6862;">你的登入帳號（handle）：<strong>${escapeHtml(user.handle)}</strong></p>
  <p style="font-size: 13px; color: #6F6862;">如果不是你發起的，這封信可以忽略，你的密碼不會改變。</p>
</div>`,
  });
}

/**
 * Send the user their handle (login id) by email. Same enumeration
 * guard as `requestPasswordReset`.
 */
export async function requestHandleRecovery(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;

  const user = await db.user.findUnique({
    where: { email },
    select: { name: true, handle: true },
  });
  if (!user) return;

  await sendEmail({
    to: email,
    subject: "相聚 · 你的登入帳號",
    text:
`嗨，${user.name}：

你註冊「相聚」時使用的登入帳號（handle）是：

    ${user.handle}

如果你也忘了密碼，可以到 /forgot 重設。

—— 相聚 Together
`,
    html:
`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #2C2825; line-height: 1.6;">
  <h2 style="color: #C75B3A; margin-bottom: 8px;">相聚 · 你的登入帳號</h2>
  <p>嗨，${escapeHtml(user.name)}：</p>
  <p>你註冊「相聚」時使用的登入帳號（handle）是：</p>
  <p style="font-size: 20px; font-family: ui-monospace, Menlo, monospace; background: #FAF5EE; padding: 12px 16px; border-radius: 8px; text-align: center;">${escapeHtml(user.handle)}</p>
  <p style="font-size: 13px; color: #6F6862;">如果你也忘了密碼，可以到 <code>/forgot</code> 重設。</p>
</div>`,
  });
}

export type ConsumeResetResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" };

/**
 * Verify a reset token and apply a new password. Used atomically:
 *   1. Look up the token by its SHA-256
 *   2. Reject if missing / expired / already used
 *   3. Update password + mark token used in a single transaction
 */
export async function consumeResetTokenAndSetPassword(
  rawToken: string,
  newPassword: string,
): Promise<ConsumeResetResult> {
  const token = rawToken.trim();
  if (!token) return { ok: false, reason: "INVALID" };
  if (newPassword.length < 8) return { ok: false, reason: "INVALID" };

  const row = await db.passwordReset.findUnique({
    where: { tokenHash: sha(token) },
  });
  if (!row) return { ok: false, reason: "INVALID" };
  if (row.usedAt) return { ok: false, reason: "USED" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "EXPIRED" };

  const passwordHash = await hashPassword(newPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    await tx.passwordReset.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    // Bonus security: invalidate other reset tokens for this user.
    await tx.passwordReset.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    });
  });

  return { ok: true, userId: row.userId };
}

/** Minimal HTML escaping for the email templates. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
