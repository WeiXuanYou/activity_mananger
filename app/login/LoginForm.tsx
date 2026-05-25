"use client";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { signInWithInviteAction, type SignInState } from "@/modules/auth/actions";

export function LoginForm() {
  const [state, formAction] = useActionState<SignInState, FormData>(
    signInWithInviteAction,
    {},
  );

  return (
    <form action={formAction}>
      <label className="block">
        <span className="text-sm font-medium text-ink/80">邀請碼</span>
        <input
          name="code"
          type="text"
          required
          autoComplete="off"
          placeholder="例如：TOGETHER-DEMO-MEMBER"
          defaultValue="TOGETHER-DEMO-MEMBER"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono tracking-wider"
        />
      </label>

      {state.error && (
        <p className="mt-2 text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <p className="mt-3 text-xs text-ink/50 leading-relaxed">
        還沒有邀請碼嗎？請聯絡邀請你的人取得；初次加入後預設為一般成員權限。
      </p>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 block w-full text-center px-4 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? "驗證中..." : "進入相聚 →"}
    </button>
  );
}
