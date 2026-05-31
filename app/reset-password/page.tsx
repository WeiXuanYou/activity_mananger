import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

/**
 * Public reset-password page. Token comes via the email link
 * (/reset-password?token=...).
 *
 * We DON'T pre-validate the token server-side here — the validation
 * lives in `resetPasswordWithTokenAction` so an attacker can't probe
 * "is this token still alive?" without committing to a password reset.
 * The form just renders whether or not the token is real.
 */
export const metadata = { title: "相聚 · 重設密碼" };

type Search = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Search) {
  const sp = await searchParams;
  const token = (sp.token ?? "").trim();

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/login" className="text-xs text-ink/55 hover:text-terracotta">
            ← 回登入
          </Link>
          <h1 className="serif text-3xl text-ink mt-3">設定新密碼</h1>
          <p className="text-ink/60 text-sm mt-2">
            設定完會自動幫你登入。
          </p>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-sm text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-3">
              ⚠ 這個連結缺少必要的參數。請從 Email 裡的連結重新點進來，或回到
              <Link href="/forgot" className="underline mx-1">/forgot</Link>
              重新申請。
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
