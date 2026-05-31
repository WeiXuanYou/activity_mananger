"use client";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import {
  resetPasswordWithTokenAction,
  type ResetState,
} from "@/modules/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<ResetState, FormData>(
    resetPasswordWithTokenAction,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="text-sm font-medium text-ink/80">新密碼（至少 8 個字）</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink/80">再次輸入新密碼</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono"
        />
      </label>
      {state.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}
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
      className="mt-3 block w-full text-center px-4 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? "儲存中..." : "設定新密碼，登入 →"}
    </button>
  );
}
