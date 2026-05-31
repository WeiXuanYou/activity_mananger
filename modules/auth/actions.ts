"use server";
import { redirect } from "next/navigation";
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
import { getRequestMeta } from "./request-meta";
import {
  loginRateLimiter,
  recoveryRateLimiter,
  changePasswordRateLimiter,
} from "./rate-limit";
import {
  validateName,
  validateHandle,
  validateAvatarColor,
  validateEmail,
  validateAvatarImage,
  validateBirthday,
  validatePassword,
  MIN_PASSWORD_LEN,
} from "./validation";

export type SignInState = { error?: string; success?: boolean };

/** Translate Prisma's P2002 ("unique constraint failed") on `User.handle`
 *  or `User.email` into a human error. Closes the race where two
 *  simultaneous setups pass the `findFirst` uniqueness pre-check then
 *  both reach `update` — without this they'd see an opaque Prisma stack
 *  trace instead of "this handle is taken". */
function translateUniqueError(e: unknown): string | null {
  const err = e as { code?: string; meta?: { target?: string | string[] } };
  if (err?.code !== "P2002") return null;
  const t = err.meta?.target;
  const target = Array.isArray(t) ? t.join(",") : (t ?? "");
  if (target.includes("handle")) return "這個暱稱已被使用，換一個吧";
  if (target.includes("email"))  return "這個 Email 已被別人使用";
  return "資料衝突，請稍後再試";
}

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

  // Throttle by IP so the short invite codes can't be brute-forced
  // (TOGETHER-XXXXXX is only ~16M combos). Shares the login limiter.
  const { ip } = await getRequestMeta();
  const gate = loginRateLimiter.check(`invite:${ip}`);
  if (!gate.allowed) {
    return { error: "嘗試太多次了，請稍後再試" };
  }

  const result = await redeemInvite(code);
  if (!result.ok) {
    loginRateLimiter.hit(`invite:${ip}`);
    const messages = {
      INVALID: "找不到這個邀請碼",
      EXPIRED: "邀請碼已過期",
      USED:    "這個邀請碼已被使用",
    };
    return { error: messages[result.reason] };
  }
  loginRateLimiter.reset(`invite:${ip}`);

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

  // Brute-force protection: throttle by client IP (NOT by account, which
  // would let anyone lock a victim out). 10 misses / 15 min — invisible
  // to a forgetful family member, fatal to online password guessing.
  const { ip } = await getRequestMeta();
  const key = `login:${ip}`;
  const gate = loginRateLimiter.check(key);
  if (!gate.allowed) {
    const mins = Math.ceil(gate.retryAfterMs / 60_000);
    return { error: `嘗試太多次了，請約 ${mins} 分鐘後再試` };
  }

  const user = await db.user.findUnique({
    where: { handle },
    select: { id: true, passwordHash: true },
  });
  // Always compare against SOMETHING — using a dummy hash if the user
  // doesn't exist keeps the response time roughly constant and avoids
  // a user-enumeration timing oracle.
  const stored = user?.passwordHash ?? "scrypt$16384$00$00";
  const ok = await verifyPassword(password, stored);
  if (!user || !ok) {
    loginRateLimiter.hit(key);
    return { error: "帳號或密碼錯誤" };
  }
  loginRateLimiter.reset(key); // clear the window on success

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
  const initial = input.initial.trim();

  // Format validation via the shared isomorphic validators (same rules
  // the client form pre-checks). Uniqueness + email policy are handled
  // below because they need the DB / differ by flow.
  const nameR = validateName(input.name);
  if (!nameR.ok) return { error: nameR.error };
  const handleR = validateHandle(input.handle);
  if (!handleR.ok) return { error: handleR.error };
  if (initial.length < 1) return { error: "頭像字母不能空白" };
  const colorR = validateAvatarColor(input.avatarColor);
  if (!colorR.ok) return { error: colorR.error };
  const name = nameR.value;
  const handle = handleR.value;
  const avatarColor = colorR.value;

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
  let emailValue: string | undefined = undefined;
  if (input.email !== undefined) {
    const emailR = validateEmail(input.email);
    if (!emailR.ok) {
      // Map the generic "請填 Email" to onboarding-specific copy.
      return { error: input.email.trim() === "" ? "請填 Email — 之後忘記密碼或帳號要靠它找回" : emailR.error };
    }
    const emailTaken = await db.user.findFirst({
      where: { email: emailR.value, NOT: { id: me.id } },
      select: { id: true },
    });
    if (emailTaken) return { error: "這個 Email 已被別人使用" };
    emailValue = emailR.value;
  }
  // If the field wasn't sent at all, only block when the user doesn't
  // already have one on file (e.g. a re-run of setup keeps the existing
  // address). New users always send the field, so this catches them.
  if (emailValue === undefined && !me.email) {
    return { error: "請填 Email — 之後忘記密碼或帳號要靠它找回" };
  }

  const avatarR = validateAvatarImage(input.avatarImage);
  if (!avatarR.ok) return { error: avatarR.error };
  const avatarImageValue = avatarR.value;

  const birthdayR = validateBirthday(input.birthday);
  if (!birthdayR.ok) return { error: birthdayR.error };
  // Setup always persists birthday (defaulting to null) like before.
  const birthdayDate = birthdayR.value ?? null;

  // Password rules: required when mustResetPassword, optional otherwise.
  let newPasswordHash: string | null | undefined = undefined;
  if (input.password && input.password.length > 0) {
    const pwR = validatePassword(input.password);
    if (!pwR.ok) return { error: pwR.error };
    newPasswordHash = await hashPassword(pwR.value);
  } else if (input.mustResetPassword) {
    return { error: `第一次登入請先設新密碼（至少 ${MIN_PASSWORD_LEN} 個字）` };
  }

  try {
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
  } catch (e) {
    const msg = translateUniqueError(e);
    if (msg) return { error: msg };
    throw e;
  }

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
  const initial = input.initial.trim();

  const nameR = validateName(input.name);
  if (!nameR.ok) return { error: nameR.error };
  const handleR = validateHandle(input.handle);
  if (!handleR.ok) return { error: handleR.error };
  if (initial.length < 1) return { error: "頭像字母不能空白" };
  const colorR = validateAvatarColor(input.avatarColor);
  if (!colorR.ok) return { error: colorR.error };
  const name = nameR.value;
  const handle = handleR.value;
  const avatarColor = colorR.value;

  const handleTaken = await db.user.findFirst({
    where: { handle, NOT: { id: me.id } },
    select: { id: true },
  });
  if (handleTaken) return { error: "這個暱稱已被使用，換一個吧" };

  const avatarR = validateAvatarImage(input.avatarImage);
  if (!avatarR.ok) return { error: avatarR.error };
  const avatarImageValue = avatarR.value;

  // Email is required and CANNOT be cleared from account settings — a
  // setup-completed user always keeps a working recovery channel. To
  // change it they replace it with another valid address.
  let emailValue: string | undefined = undefined;
  if (input.email !== undefined) {
    if (input.email.trim() === "") {
      return { error: "Email 不能清空（要靠它找回密碼 / 帳號）" };
    }
    const emailR = validateEmail(input.email);
    if (!emailR.ok) return { error: emailR.error };
    const emailTaken = await db.user.findFirst({
      where: { email: emailR.value, NOT: { id: me.id } },
      select: { id: true },
    });
    if (emailTaken) return { error: "這個 Email 已被別人使用" };
    emailValue = emailR.value;
  }

  const birthdayR = validateBirthday(input.birthday);
  if (!birthdayR.ok) return { error: birthdayR.error };
  const birthdayDate = birthdayR.value;

  try {
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
  } catch (e) {
    const msg = translateUniqueError(e);
    if (msg) return { error: msg };
    throw e;
  }

  // Revalidate every path that surfaces the user's name / avatar /
  // handle: the account page itself, the authenticated shell layout,
  // the feed (greeting line), and the per-user profile page.
  revalidatePath("/app/account");
  revalidatePath("/app", "layout");
  revalidatePath("/app/feed");
  revalidatePath(`/app/members/${me.id}`);
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
  const pwR = validatePassword(input.newPassword);
  if (!pwR.ok) return { error: pwR.error.replace("密碼", "新密碼") };

  // Throttle wrong-current-password attempts on the account. Keyed by
  // user id (not IP) so a session hijacker can't grind down attempts
  // from a different IP than the real owner, and a real owner who
  // legitimately forgot can't be locked out by someone else.
  const rlKey = `chpw:${me.id}`;
  const gate = changePasswordRateLimiter.check(rlKey);
  if (!gate.allowed) {
    const mins = Math.ceil(gate.retryAfterMs / 60_000);
    return { error: `嘗試太多次了，請約 ${mins} 分鐘後再試` };
  }

  if (me.passwordHash) {
    const ok = await verifyPassword(input.currentPassword ?? "", me.passwordHash);
    if (!ok) {
      changePasswordRateLimiter.hit(rlKey);
      return { error: "目前的密碼不對" };
    }
    // Block recycling the exact same password.
    if (input.currentPassword === input.newPassword) {
      return { error: "新密碼不能跟舊密碼一樣" };
    }
  }
  // No prior password ("set first password" path): nothing more to
  // verify. This is the only branch a session hijacker on an invite-
  // only user could exploit; for now we accept the trade-off because
  // forcing a setup-completed user to ALWAYS have a password is the
  // long-term fix (tracked in the README).
  const passwordHash = await hashPassword(pwR.value);
  await db.user.update({ where: { id: me.id }, data: { passwordHash } });
  changePasswordRateLimiter.reset(rlKey);
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
  // If we can't identify "this" session — for any reason — refuse
  // rather than nuking every session for the user (which would include
  // the one the form was submitted from). The earlier version spread
  // an empty `{}` into the where clause and silently self-immolated.
  if (!tok) {
    return { error: "目前的 session 找不到，請重新登入後再試" };
  }
  const currentHash = createHash("sha256").update(tok).digest("hex");
  await db.session.deleteMany({
    where: { userId: me.id, tokenHash: { not: currentHash } },
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

/** IP-level throttle for the public recovery endpoints. Stops an
 *  enumeration attacker from hammering the form: even if a residual
 *  timing leak existed, 5 requests / 15 min means a meaningful
 *  enumeration attack across millions of candidate emails is
 *  impractical. A real user who mistypes once is unaffected. */
async function recoveryGate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { ip } = await getRequestMeta();
  const gate = recoveryRateLimiter.check(`recovery:${ip}`);
  if (!gate.allowed) {
    const mins = Math.ceil(gate.retryAfterMs / 60_000);
    return { ok: false, error: `嘗試太多次了，請約 ${mins} 分鐘後再試` };
  }
  recoveryRateLimiter.hit(`recovery:${ip}`); // count EVERY request, not just misses
  return { ok: true };
}

export async function requestPasswordResetAction(
  _prev: RecoveryState | undefined,
  formData: FormData,
): Promise<RecoveryState> {
  const emailR = validateEmail(String(formData.get("email") ?? ""));
  if (!emailR.ok) return { error: emailR.error };
  const gate = await recoveryGate();
  if (!gate.ok) return { error: gate.error };
  const { origin } = await getRequestMeta();
  await requestPasswordReset(emailR.value, origin);
  return { sent: true };
}

export async function requestHandleRecoveryAction(
  _prev: RecoveryState | undefined,
  formData: FormData,
): Promise<RecoveryState> {
  const emailR = validateEmail(String(formData.get("email") ?? ""));
  if (!emailR.ok) return { error: emailR.error };
  const gate = await recoveryGate();
  if (!gate.ok) return { error: gate.error };
  await requestHandleRecovery(emailR.value);
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
  const pwR = validatePassword(password);
  if (!pwR.ok) return { error: pwR.error };
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
