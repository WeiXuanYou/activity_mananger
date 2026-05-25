"use server";
import { redirect } from "next/navigation";
import { redeemInvite } from "./invite";
import { createSession, setSessionCookie, signOut as doSignOut } from "./session";

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
