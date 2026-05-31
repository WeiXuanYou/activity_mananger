"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { redeemInvite } from "./invite";
import { createSession, setSessionCookie, signOut as doSignOut, requireCurrentUser } from "./session";
import { hashPassword, verifyPassword } from "./password";
import {
  requestPasswordReset,
  requestHandleRecovery,
  consumeResetTokenAndSetPassword,
} from "./recovery";

/** RFC-5322 is impossibly hard to express exactly; this catches the
 *  shape that matters (something@something.tld) and rejects whitespace.
 *  Real "is it deliverable?" gets answered when the email actually
 *  goes out. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best-effort read of the current request's origin so we can build
 *  absolute recovery links. Falls back to APP_URL env in production. */
async function currentOrigin(): Promise<string | undefined> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "http";
    const host = h.get("host");
    if (host) return `${proto}://${host}`;
  } catch {}
  return undefined;
}

export type SignInState = { error?: string; success?: boolean };

/**
 * REGISTER a new account via invite code. Creates a user with no
 * password set yet; the post-signup /app/setup form captures name +
 * handle + avatar + (optional) password. Until they set one, they can
 * only log back in by redeeming another invite — fine for invitees who
 * stick to one device.
 */
export async function signInWithInviteAction(
  _prev: SignInState | undefined,
  formData: FormData,
): Promise<SignInState> {
  const code = String(formData.get("code") ?? "");
  const result = await redeemInvite(code);
  if (!result.ok) {
    const messages = {
      INVALID: "找不到這個邀請碼",
      EXPIRED: "邀請碼已過期",
      USED:    "這個邀請碼已被使用",
    };
    return { error: messages[result.reason] };
  }

  const token = await createSession(result.userId);
  await setSessionCookie(token);
  redirect("/app/feed");
}

/**
 * LOGIN with handle + password. The handle path is case-insensitive
 * (we store handles lowercased) and the error message is intentionally
 * vague — "帳號或密碼錯誤" — to avoid leaking which one was wrong.
 *
 * On success: same redirect dance as invite redemption. If the user's
 * setupCompleted is false, the app layout will render the setup form
 * in place (no extra redirect).
 */
export async function signInWithPasswordAction(
  _prev: SignInState | undefined,
  formData: FormData,
): Promise<SignInState> {
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!handle || !password) return { error: "請輸入帳號和密碼" };

  const user = await db.user.findUnique({
    where: { handle },
    select: { id: true, passwordHash: true },
  });
  // Always compare against SOMETHING — using a dummy hash if the user
  // doesn't exist keeps the response time roughly constant and avoids
  // a user-enumeration timing oracle.
  const stored = user?.passwordHash ?? "scrypt$16384$00$00";
  const ok = await verifyPassword(password, stored);
  if (!user || !ok) return { error: "帳號或密碼錯誤" };

  const token = await createSession(user.id);
  await setSessionCookie(token);
  redirect("/app/feed");
}

export async function signOutAction() {
  await doSignOut();
  redirect("/login");
}

/**
 * Complete the post-signup profile. Open to any authenticated user
 * (no permission key) — the gate is "I'm me editing my own profile",
 * enforced by `requireCurrentUser`. New users land here on first login
 * because `setupCompleted` defaults to false in the redeemInvite flow.
 *
 * Password is optional on FIRST setup (invite-only users can skip and
 * still use the app via session cookie). BUT if the user already has a
 * password (e.g. the bootstrap admin) we require they pick a new one
 * here — that lets the seed ship a known weak default (admin/admin)
 * and force a rotation on first login.
 *
 * Validation:
 *   - name: 1–40 chars (required)
 *   - handle: 2–24 chars, /^[a-z0-9-]+$/, unique
 *   - initial: 1 char (we display it on the avatar circle)
 *   - avatarColor: hex string from the picker; we don't enforce a
 *     specific palette so people can paste any color
 *   - birthday: optional YYYY-MM-DD
 *   - password: optional unless `mustResetPassword` flag is set
 */
export type CompleteSetupState = { error?: string };

/** Cap on inline avatar image size. ~600 KB of base64 ≈ ~450 KB raw —
 *  big enough for a phone snapshot, small enough to keep User rows
 *  readable. The setup form pre-resizes client-side to stay well under. */
const AVATAR_MAX_BYTES = 600_000;

export async function completeSetupAction(input: {
  name: string;
  handle: string;
  initial: string;
  avatarColor: string;
  /** Optional uploaded avatar as a data URL (data:image/...;base64,...).
   *  Pass `""` (empty string) to explicitly clear an existing image and
   *  fall back to the initial+color circle. `undefined` = leave unchanged. */
  avatarImage?: string;
  /** Optional contact email. Required for password / handle recovery
   *  to work. Empty string is treated as "no email". */
  email?: string;
  birthday?: string | null;
  password?: string;
  /** True when the existing password is known-weak (bootstrap admin
   *  default) and must be replaced before setup can complete. */
  mustResetPassword?: boolean;
}): Promise<CompleteSetupState> {
  const me = await requireCurrentUser();
  const name = input.name.trim();
  const handle = input.handle.trim().toLowerCase();
  const initial = input.initial.trim();
  const avatarColor = input.avatarColor.trim();

  if (!name) return { error: "請填名字" };
  if (name.length > 40) return { error: "名字太長（上限 40 字）" };
  if (!/^[a-z0-9-]{2,24}$/.test(handle)) return { error: "暱稱限 2-24 字小寫英數與 -" };
  if (initial.length < 1) return { error: "頭像字母不能空白" };
  if (!/^#[0-9a-fA-F]{6}$/.test(avatarColor)) return { error: "avatar 顏色格式不對" };

  // handle uniqueness: skip if this user already owns it
  const taken = await db.user.findFirst({
    where: { handle, NOT: { id: me.id } },
    select: { id: true },
  });
  if (taken) return { error: "這個暱稱已被使用，換一個吧" };

  // Email is REQUIRED to finish onboarding — it's the only recovery
  // channel for password / handle, and we'd rather refuse setup than
  // strand a family member with no way back in. The DB column stays
  // nullable on purpose (invite redemption + the bootstrap admin create
  // a row *before* a person picks an email); the requirement is
  // enforced here, at the moment onboarding completes.
  //
  // We store lowercased so later lookups (also lowercased) hit the
  // unique index regardless of how the user typed it.
  let emailValue: string | undefined = undefined;
  if (input.email !== undefined) {
    const e = input.email.trim().toLowerCase();
    if (e === "") {
      return { error: "請填 Email — 之後忘記密碼或帳號要靠它找回" };
    } else if (!EMAIL_RE.test(e)) {
      return { error: "Email 格式看起來不太對" };
    } else {
      const emailTaken = await db.user.findFirst({
        where: { email: e, NOT: { id: me.id } },
        select: { id: true },
      });
      if (emailTaken) return { error: "這個 Email 已被別人使用" };
      emailValue = e;
    }
  }
  // If the field wasn't sent at all, only block when the user doesn't
  // already have one on file (e.g. a re-run of setup keeps the existing
  // address). New users always send the field, so this catches them.
  if (emailValue === undefined && !me.email) {
    return { error: "請填 Email — 之後忘記密碼或帳號要靠它找回" };
  }

  // Avatar image validation. Accept only inline data URLs we expect;
  // reject http(s)/blob/javascript schemes — those would let someone
  // hot-link tracking pixels or worse from a user profile.
  let avatarImageValue: string | null | undefined = undefined;
  if (input.avatarImage !== undefined) {
    const v = input.avatarImage;
    if (v === "") {
      avatarImageValue = null;
    } else {
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(v)) {
        return { error: "頭像格式不對（只接受 png / jpeg / webp / gif）" };
      }
      if (v.length > AVATAR_MAX_BYTES) {
        return { error: "頭像太大（請壓到 500KB 以下）" };
      }
      avatarImageValue = v;
    }
  }

  let birthdayDate: Date | null = null;
  if (input.birthday) {
    const d = new Date(input.birthday);
    if (Number.isNaN(d.getTime())) return { error: "生日格式不對" };
    birthdayDate = d;
  }

  // Password rules: required when mustResetPassword, optional otherwise.
  // Same min-length enforcement (8 chars) whether you're setting your
  // first password or rotating the bootstrap one.
  let newPasswordHash: string | null | undefined = undefined;
  if (input.password && input.password.length > 0) {
    if (input.password.length < 8) return { error: "密碼至少 8 個字" };
    newPasswordHash = await hashPassword(input.password);
  } else if (input.mustResetPassword) {
    return { error: "第一次登入請先設新密碼（至少 8 個字）" };
  }

  await db.user.update({
    where: { id: me.id },
    data: {
      name,
      handle,
      initial: initial.slice(0, 2),
      avatarColor,
      birthday: birthdayDate,
      setupCompleted: true,
      ...(avatarImageValue !== undefined ? { avatarImage: avatarImageValue } : {}),
      ...(emailValue !== undefined ? { email: emailValue } : {}),
      ...(newPasswordHash !== undefined ? { passwordHash: newPasswordHash } : {}),
    },
  });

  redirect("/app/feed");
}

// ─────────────────────────────────────────────────────────────────────
// Account-settings actions (post-setup self-service updates).
//
// Three actions kept separate on purpose:
//   - updateProfileAction  — name / handle / avatar / birthday / email
//   - changePasswordAction — current + new password (requires old)
//   - signOutOtherSessionsAction — security hygiene after password change
//
// Each returns `{ ok | error }` so the client form can show inline
// feedback without losing the other fields' state.
// ─────────────────────────────────────────────────────────────────────

export type AccountResult = { ok?: true; error?: string };

export async function updateProfileAction(input: {
  name: string;
  handle: string;
  initial: string;
  avatarColor: string;
  avatarImage?: string;
  email?: string;
  birthday?: string | null;
}): Promise<AccountResult> {
  const me = await requireCurrentUser();
  const name = input.name.trim();
  const handle = input.handle.trim().toLowerCase();
  const initial = input.initial.trim();
  const avatarColor = input.avatarColor.trim();

  if (!name) return { error: "請填名字" };
  if (name.length > 40) return { error: "名字太長（上限 40 字）" };
  if (!/^[a-z0-9-]{2,24}$/.test(handle)) return { error: "暱稱限 2-24 字小寫英數與 -" };
  if (initial.length < 1) return { error: "頭像字母不能空白" };
  if (!/^#[0-9a-fA-F]{6}$/.test(avatarColor)) return { error: "頭像顏色格式不對" };

  const handleTaken = await db.user.findFirst({
    where: { handle, NOT: { id: me.id } },
    select: { id: true },
  });
  if (handleTaken) return { error: "這個暱稱已被使用，換一個吧" };

  let avatarImageValue: string | null | undefined = undefined;
  if (input.avatarImage !== undefined) {
    const v = input.avatarImage;
    if (v === "") {
      avatarImageValue = null;
    } else {
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(v)) {
        return { error: "頭像格式不對（只接受 png / jpeg / webp / gif）" };
      }
      if (v.length > AVATAR_MAX_BYTES) {
        return { error: "頭像太大（請壓到 500KB 以下）" };
      }
      avatarImageValue = v;
    }
  }

  // Email is required and CANNOT be cleared from account settings — a
  // setup-completed user always keeps a working recovery channel. To
  // change it they replace it with another valid address.
  let emailValue: string | undefined = undefined;
  if (input.email !== undefined) {
    const e = input.email.trim().toLowerCase();
    if (e === "") {
      return { error: "Email 不能清空（要靠它找回密碼 / 帳號）" };
    } else if (!EMAIL_RE.test(e)) {
      return { error: "Email 格式看起來不太對" };
    } else {
      const emailTaken = await db.user.findFirst({
        where: { email: e, NOT: { id: me.id } },
        select: { id: true },
      });
      if (emailTaken) return { error: "這個 Email 已被別人使用" };
      emailValue = e;
    }
  }

  let birthdayDate: Date | null | undefined = undefined;
  if (input.birthday !== undefined) {
    if (input.birthday === null || input.birthday === "") {
      birthdayDate = null;
    } else {
      const d = new Date(input.birthday);
      if (Number.isNaN(d.getTime())) return { error: "生日格式不對" };
      birthdayDate = d;
    }
  }

  await db.user.update({
    where: { id: me.id },
    data: {
      name,
      handle,
      initial: initial.slice(0, 2),
      avatarColor,
      ...(avatarImageValue !== undefined ? { avatarImage: avatarImageValue } : {}),
      ...(emailValue !== undefined ? { email: emailValue } : {}),
      ...(birthdayDate !== undefined ? { birthday: birthdayDate } : {}),
    },
  });

  revalidatePath("/app/account");
  revalidatePath("/app");
  return { ok: true };
}

/**
 * Change the user's password.
 *
 * Two-factor by intent:
 *   - know the current password (proves the operator is the account owner)
 *   - have an active session (proves the operator has the cookie)
 *
 * Without the current-password requirement, anyone who hijacked a
 * session cookie could lock the real owner out by rotating the
 * password. Worth the extra field.
 *
 * If the user has no password yet (invite-only signup, never set one),
 * `currentPassword` is treated as a no-op and we skip the verify step.
 * In that case this is "set my first password".
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AccountResult> {
  const me = await requireCurrentUser();
  if (!input.newPassword || input.newPassword.length < 8) {
    return { error: "新密碼至少 8 個字" };
  }
  if (me.passwordHash) {
    const ok = await verifyPassword(input.currentPassword ?? "", me.passwordHash);
    if (!ok) return { error: "目前的密碼不對" };
    // Block recycling the exact same password — a small but real
    // benefit: stops a "rotate to itself" no-op.
    if (input.currentPassword === input.newPassword) {
      return { error: "新密碼不能跟舊密碼一樣" };
    }
  }
  const passwordHash = await hashPassword(input.newPassword);
  await db.user.update({ where: { id: me.id }, data: { passwordHash } });
  return { ok: true };
}

/**
 * Kill every session for the current user EXCEPT the one driving this
 * request. Used as the natural "I just changed my password, log me out
 * of other devices" step. The current session lives because the cookie
 * value is what identifies "this" session and we don't want the form
 * to log itself out mid-submit.
 *
 * We delete by NOT-equals on the current tokenHash — re-deriving it
 * from the cookie since `requireCurrentUser` doesn't expose the hash.
 */
export async function signOutOtherSessionsAction(): Promise<AccountResult> {
  const me = await requireCurrentUser();
  const { createHash } = await import("node:crypto");
  const { cookies } = await import("next/headers");
  const c = await cookies();
  const tok = c.get("together_session")?.value;
  const currentHash = tok
    ? createHash("sha256").update(tok).digest("hex")
    : null;

  await db.session.deleteMany({
    where: {
      userId: me.id,
      ...(currentHash ? { tokenHash: { not: currentHash } } : {}),
    },
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Public recovery actions — no auth required, generic responses.
// ─────────────────────────────────────────────────────────────────────

export type RecoveryState = {
  /** Always the same "we sent if we have it" copy — never reveals match. */
  sent?: boolean;
  error?: string;
};

export async function requestPasswordResetAction(
  _prev: RecoveryState | undefined,
  formData: FormData,
): Promise<RecoveryState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Email 格式看起來不太對" };
  }
  const origin = await currentOrigin();
  await requestPasswordReset(email, origin);
  return { sent: true };
}

export async function requestHandleRecoveryAction(
  _prev: RecoveryState | undefined,
  formData: FormData,
): Promise<RecoveryState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Email 格式看起來不太對" };
  }
  await requestHandleRecovery(email);
  return { sent: true };
}

export type ResetState = { error?: string };

export async function resetPasswordWithTokenAction(
  _prev: ResetState | undefined,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "密碼至少 8 個字" };
  if (password !== confirm) return { error: "兩次輸入的密碼不一樣" };

  const r = await consumeResetTokenAndSetPassword(token, password);
  if (!r.ok) {
    const map = {
      INVALID: "這個重設連結無效或已失效",
      EXPIRED: "這個重設連結已過期，請重新申請",
      USED:    "這個重設連結已被使用過了",
    };
    return { error: map[r.reason] };
  }

  // Sign the user in with the new password by creating a fresh session.
  const token2 = await createSession(r.userId);
  await setSessionCookie(token2);
  redirect("/app/feed");
}
