"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { redeemInvite } from "./invite";
import { createSession, setSessionCookie, signOut as doSignOut, requireCurrentUser } from "./session";
import { hashPassword, verifyPassword } from "./password";

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

export async function completeSetupAction(input: {
  name: string;
  handle: string;
  initial: string;
  avatarColor: string;
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
  if (!/^[a-z0-9-]{2,24}$/.test(handle)) return { error: "handle 限 2-24 字小寫英數與 -" };
  if (initial.length < 1) return { error: "頭像字母不能空白" };
  if (!/^#[0-9a-fA-F]{6}$/.test(avatarColor)) return { error: "avatar 顏色格式不對" };

  // handle uniqueness: skip if this user already owns it
  const taken = await db.user.findFirst({
    where: { handle, NOT: { id: me.id } },
    select: { id: true },
  });
  if (taken) return { error: "這個 handle 已被使用，換一個吧" };

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
      ...(newPasswordHash !== undefined ? { passwordHash: newPasswordHash } : {}),
    },
  });

  redirect("/app/feed");
}
