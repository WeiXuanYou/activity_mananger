"use client";
/**
 * Dual-mode recovery form:
 *   - 忘記密碼 → POST email, server emails a reset link
 *   - 忘記帳號 → POST email, server emails back the handle
 *
 * Same generic success message for both modes regardless of whether the
 * email matches an account on file. The user is told "we've sent it if
 * we recognize the email" so neither flow becomes an enumeration oracle.
 */
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  requestHandleRecoveryAction,
  type RecoveryState,
} from "@/modules/auth/actions";

export function ForgotForm() {
  const [mode, setMode] = useState<"password" | "handle">("password");
  return (
    <div>
      <div className="flex gap-2 mb-5">
        <Tab on={mode === "password"} onClick={() => setMode("password")}>🔑 忘記密碼</Tab>
        <Tab on={mode === "handle"} onClick={() => setMode("handle")}>🪪 忘記帳號</Tab>
      </div>

      {mode === "password" ? <PasswordResetPanel /> : <HandleRecoveryPanel />}

      <div className="mt-6 pt-5 border-t border-sand text-xs text-ink/55 leading-relaxed">
        <p>
          沒填過 Email？或 Email 已不能收信？請聯絡邀請你的家人/朋友，請他們在
          <Link href="/app/admin" className="text-terracotta hover:underline">管理</Link>
          幫你重設或產生新的邀請碼。
        </p>
      </div>
    </div>
  );
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-soft text-sm font-medium transition ${
        on ? "bg-terracotta text-white shadow-card" : "bg-cream/50 text-ink/70 hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

function PasswordResetPanel() {
  const [state, formAction] = useActionState<RecoveryState, FormData>(
    requestPasswordResetAction,
    {},
  );
  if (state.sent) {
    return (
      <SuccessPanel>
        如果這個 Email 對得上某個相聚帳號，我們已經把<strong>重設密碼的連結</strong>寄出。
        請去信箱（也記得查一下垃圾信匣）。連結 1 小時內有效。
      </SuccessPanel>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <EmailField name="email" />
      {state.error && <ErrorLine msg={state.error} />}
      <SubmitButton label="寄重設密碼連結 →" pendingLabel="寄送中..." />
    </form>
  );
}

function HandleRecoveryPanel() {
  const [state, formAction] = useActionState<RecoveryState, FormData>(
    requestHandleRecoveryAction,
    {},
  );
  if (state.sent) {
    return (
      <SuccessPanel>
        如果這個 Email 對得上某個相聚帳號，我們已經把你的<strong>登入帳號（handle）</strong>寄出。
        請去信箱查。
      </SuccessPanel>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <EmailField name="email" />
      {state.error && <ErrorLine msg={state.error} />}
      <SubmitButton label="寄回我的帳號 →" pendingLabel="寄送中..." />
    </form>
  );
}

function EmailField({ name }: { name: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">Email</span>
      <input
        name={name}
        type="email"
        required
        autoComplete="email"
        placeholder="你註冊時填的信箱"
        className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono text-sm"
      />
    </label>
  );
}

function ErrorLine({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
      ⚠ {msg}
    </p>
  );
}

function SuccessPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sage-soft/30 border border-sage/30 rounded-soft p-4 text-sm text-sage-dark leading-relaxed">
      <div className="text-2xl mb-2">📬</div>
      {children}
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 block w-full text-center px-4 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
