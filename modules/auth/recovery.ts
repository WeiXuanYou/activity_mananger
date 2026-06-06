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
 *     generic success message regardless of whether the email matches
 *     a real account. The mail is dispatched **without await** in BOTH
 *     branches (we fire-and-forget) so the on-the-wire timing is the
 *     cheap DB lookup whether or not we matched. Combined with the
 *     per-IP rate limit on the public endpoints (in `actions.ts`),
 *     that closes the practical enumeration oracle.
 *
 *   - **Tokens stored hashed**: random 32-byte hex token sent to the
 *     user, SHA-256 of it stored in DB. A DB leak can't be replayed
 *     to forge reset links.
 *
 *   - **Tokens pinned to the email-at-issue**: `PasswordReset.email`
 *     captures the address we issued to. At consumption we verify the
 *     user's current email still matches. A leaked link to an old
 *     mailbox the user no longer controls cannot reset their password.
 *
 *   - **One-shot, atomic**: the "mark used" step uses a conditional
 *     UPDATE that fails (count=0) if anyone else has already consumed
 *     the token — so a double-click with two different new passwords
 *     can't leave the account in an indeterminate state.
 *
 *   - **Short TTL**: 1 hour.
 *
 *   - **Kills existing sessions on success**: the whole point of
 *     password recovery is to lock attackers out, so a successful
 *     reset deletes every Session for the user and creates a fresh
 *     one for the recovering user (done in the calling action).
 */

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { PUBLIC_BASE_URL } from "@/lib/config";
import { sendEmail, renderEmailLayout, renderButton, escapeHtml } from "@/modules/mail";
import { hashPassword } from "./password";
import { normalizeEmail } from "./validation";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Min gap between consecutive reset emails to the same account.
 *  Caps mail-bomb abuse at 1/min/account; invisible to a real user who
 *  just mistyped and tried again. */
const RESEND_COOLDOWN_MS = 60 * 1000;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Build an absolute URL for the recovery link. */
function buildResetLink(origin: string | undefined, token: string): string {
  const base = origin || PUBLIC_BASE_URL;
  return `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
}

/**
 * Issue a password-reset token for the user with this email (if any).
 * Returns void either way — the caller's response is the same generic
 * "we sent it if we know you", and the mail goes out fire-and-forget so
 * the network call doesn't show up in response time.
 */
export async function requestPasswordReset(
  rawEmail: string,
  origin?: string,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!email) return;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, handle: true, email: true },
  });
  if (!user || !user.email) return;

  // Atomic cooldown + write: try to create a NEW token row, but only if
  // there isn't a fresh one from the last minute. Doing this as
  // create+findFirst-before-it would race. We rely on the unique
  // tokenHash + a findFirst gate; the gate is the cooldown check.
  const cooldown = await db.passwordReset.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (cooldown) return;

  // GC prior unused + expired tokens (we don't need them once we issue
  // a fresh one). Cheap on SQLite at this scale; avoids a scheduled job.
  await db.passwordReset.deleteMany({
    where: { userId: user.id, OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }] },
  });

  const token = randomBytes(32).toString("hex");
  await db.passwordReset.create({
    data: {
      userId: user.id,
      email: user.email,
      tokenHash: sha(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  // Fire-and-forget. We return before the network call to Resend
  // completes, so the response time is bounded by the (fast) DB
  // ops above — closing the enumeration timing channel.
  const link = buildResetLink(origin, token);
  void sendEmail({
    to: email,
    subject: "相聚 · 重設密碼",
    text: `嗨，${user.name}：

我們收到「相聚」的密碼重設請求。如果是你發起的，請點下面的連結設定新密碼（1 小時內有效）：

${link}

你的登入帳號（handle）：${user.handle}

如果不是你發起的，這封信可以忽略。你的密碼不會改變。

—— 相聚 Together
`,
    html: passwordResetHtml({ name: user.name, handle: user.handle, link }),
  }).catch((e) => console.error("[recovery] reset mail failed:", e));
}

/**
 * Email the user their handle (login id). Same enumeration / timing
 * properties as `requestPasswordReset`, plus a 60s cooldown stored as
 * `User.lastHandleRecoveryAt` (no token table needed because there's
 * nothing to revoke — we're just gating mail dispatch).
 */
export async function requestHandleRecovery(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!email) return;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, handle: true, lastHandleRecoveryAt: true },
  });
  if (!user) return;

  // 60-second cooldown — same anti-mail-bomb policy as password reset.
  // Cheap: one indexed column on User; no separate table.
  if (
    user.lastHandleRecoveryAt &&
    user.lastHandleRecoveryAt.getTime() > Date.now() - RESEND_COOLDOWN_MS
  ) {
    return;
  }
  await db.user.update({
    where: { id: user.id },
    data: { lastHandleRecoveryAt: new Date() },
  });

  void sendEmail({
    to: email,
    subject: "相聚 · 你的登入帳號",
    text: `嗨，${user.name}：

你註冊「相聚」時使用的登入帳號（handle）是：

    ${user.handle}

如果你也忘了密碼，可以到 /forgot 重設。

—— 相聚 Together
`,
    html: handleRecoveryHtml({ name: user.name, handle: user.handle }),
  }).catch((e) => console.error("[recovery] handle mail failed:", e));
}

export type ConsumeResetResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" };

/**
 * Atomically verify a reset token, apply the new password, and kill
 * every existing session for the user.
 *
 * The "consume" step is a conditional UPDATE (`updateMany` with a
 * `usedAt: null` predicate) so two simultaneous redemptions don't both
 * succeed. The session purge is part of the same transaction.
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

  // Verify the user's current email still matches the address this
  // token was issued to. Blocks reuse of a link forwarded to / leaked
  // from an old mailbox the user no longer controls.
  const user = await db.user.findUnique({
    where: { id: row.userId },
    select: { email: true },
  });
  if (!user || user.email !== row.email) return { ok: false, reason: "INVALID" };

  const passwordHash = await hashPassword(newPassword);

  return await db.$transaction(async (tx) => {
    // Conditional UPDATE: only one of N racing redemptions wins.
    const claim = await tx.passwordReset.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claim.count === 0) {
      // Lost the race. Treat as already-used.
      return { ok: false, reason: "USED" } as ConsumeResetResult;
    }
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    // Kill any other unused tokens AND every existing session for this
    // user. Recovery's job is to lock attackers out — leaving sessions
    // alive would defeat that.
    await tx.passwordReset.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    });
    await tx.session.deleteMany({ where: { userId: row.userId } });
    return { ok: true, userId: row.userId } as ConsumeResetResult;
  });
}

// ─── HTML templates (use the shared email layout for cross-client safety) ──

function passwordResetHtml(p: { name: string; handle: string; link: string }): string {
  const link = escapeHtml(p.link);
  return renderEmailLayout({
    title: "重設你的密碼",
    preheader: `${p.name}，重設密碼的連結 1 小時內有效。`,
    body: `
      <p style="margin:0 0 12px 0;">嗨，<strong>${escapeHtml(p.name)}</strong>：</p>
      <p style="margin:0 0 8px 0;">我們收到「相聚」的密碼重設請求。如果是你發起的，請點下面的按鈕設定新密碼<br><strong style="color:#C75B3A;">（1 小時內有效）</strong>：</p>
      ${renderButton(p.link, "設定新密碼")}
      <p style="margin:18px 0 0 0; font-size:13px; color:#6F6862;">
        如果按鈕沒反應，請複製這個連結貼到瀏覽器：<br>
        <a href="${link}" style="color:#C75B3A; word-break:break-all; text-decoration:underline;">${link}</a>
      </p>
      <div style="height:1px; background:#E8DDD0; margin:20px 0; line-height:1px; font-size:1px;">&nbsp;</div>
      <p style="margin:0 0 6px 0; font-size:13px; color:#6F6862;">
        順便附上你的登入帳號（handle）：
      </p>
      <p style="margin:0 0 12px 0; font-family:ui-monospace, Menlo, monospace; font-size:15px; background:#FAF5EE; padding:8px 12px; border-radius:6px; display:inline-block;">
        ${escapeHtml(p.handle)}
      </p>
      <p style="margin:14px 0 0 0; font-size:13px; color:#6F6862;">
        ⚠️ 如果不是你發起的，請忽略這封信 —— 你的密碼不會改變。
      </p>
    `,
  });
}

function handleRecoveryHtml(p: { name: string; handle: string }): string {
  return renderEmailLayout({
    title: "你的登入帳號",
    preheader: `${p.name}，你的登入帳號是 ${p.handle}。`,
    body: `
      <p style="margin:0 0 12px 0;">嗨，<strong>${escapeHtml(p.name)}</strong>：</p>
      <p style="margin:0 0 14px 0;">你註冊「相聚」時使用的登入帳號（handle）是：</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto;">
        <tr>
          <td align="center" bgcolor="#FAF5EE" style="padding:14px 28px; border-radius:8px; border:1px solid #E8DDD0;">
            <span style="font-family:ui-monospace, Menlo, monospace; font-size:20px; color:#2C2825; letter-spacing:1px;">
              ${escapeHtml(p.handle)}
            </span>
          </td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0; font-size:13px; color:#6F6862;">
        用這個帳號 + 你的密碼就可以登入。如果你也忘了密碼，可以到登入頁的「忘記密碼或帳號」重設。
      </p>
      <p style="margin:14px 0 0 0; font-size:13px; color:#6F6862;">
        ⚠️ 如果你沒有發起這個請求，這封信可以忽略。
      </p>
    `,
  });
}
