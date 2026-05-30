"use client";
/**
 * Two-mode auth UI:
 *   - "登入"   → existing user with handle + password
 *   - "註冊"   → new user redeems an invite code (creates an account,
 *                 then the layout shows the profile setup form)
 *
 * Default mode is "登入" because returning users open this page far
 * more often than first-timers. Tab state is local — no router change,
 * no flash.
 */
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import {
  signInWithInviteAction,
  signInWithPasswordAction,
  type SignInState,
} from "@/modules/auth/actions";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div>
      <div className="flex gap-2 mb-5">
        <ModeTab on={mode === "login"} onClick={() => setMode("login")}>
          🔑 登入
        </ModeTab>
        <ModeTab on={mode === "register"} onClick={() => setMode("register")}>
          ✨ 用邀請碼註冊
        </ModeTab>
      </div>

      {mode === "login" ? <PasswordPanel /> : <InvitePanel />}
    </div>
  );
}

function ModeTab({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-soft text-sm font-medium transition ${
        on
          ? "bg-terracotta text-white shadow-card"
          : "bg-cream/50 text-ink/70 hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

function PasswordPanel() {
  const [state, formAction] = useActionState<SignInState, FormData>(
    signInWithPasswordAction,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-ink/80">帳號（handle）</span>
        <input
          name="handle"
          type="text"
          required
          autoComplete="username"
          placeholder="例如：admin"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink/80">密碼</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono"
        />
      </label>

      {state.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <SubmitButton label="進入相聚 →" pendingLabel="驗證中..." />

      <p className="text-xs text-ink/50 leading-relaxed pt-2">
        第一次使用？預設管理員是 <code className="text-terracotta">admin</code> / <code className="text-terracotta">admin</code>，
        登入後會強迫你換掉。<br />
        家人朋友請用上面「✨ 用邀請碼註冊」。
      </p>
    </form>
  );
}

function InvitePanel() {
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
          placeholder="例如：TOGETHER-ABC123"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono tracking-wider"
        />
      </label>

      {state.error && (
        <p className="mt-2 text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <p className="mt-3 text-xs text-ink/50 leading-relaxed">
        還沒有邀請碼嗎？請聯絡邀請你的人取得；之後可以在個人設定裡建立自己的帳號密碼。
      </p>

      <SubmitButton label="進入相聚 →" pendingLabel="驗證中..." />
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 block w-full text-center px-4 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
