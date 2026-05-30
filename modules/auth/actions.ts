"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { redeemInvite } from "./invite";
import { createSession, setSessionCookie, signOut as doSignOut, requireCurrentUser } from "./session";

export type SignInState = { error?: string; success?: boolean };

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
 * Validation:
 *   - name: 1–40 chars (required)
 *   - handle: 2–24 chars, /^[a-z0-9-]+$/, unique
 *   - initial: 1 char (we display it on the avatar circle)
 *   - avatarColor: hex string from the picker; we don't enforce a
 *     specific palette so people can paste any color
 *   - birthday: optional YYYY-MM-DD
 */
export type CompleteSetupState = { error?: string };

export async function completeSetupAction(input: {
  name: string;
  handle: string;
  initial: string;
  avatarColor: string;
  birthday?: string | null;
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

  await db.user.update({
    where: { id: me.id },
    data: {
      name,
      handle,
      initial: initial.slice(0, 2), // trim, in case they typed >2 chars
      avatarColor,
      birthday: birthdayDate,
      setupCompleted: true,
    },
  });

  redirect("/app/feed");
}
