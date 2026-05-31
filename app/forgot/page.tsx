import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

/**
 * Public recovery entry.
 *
 * One page, two modes (password reset / handle lookup) selected by tab.
 * The server response is identical regardless of whether the email
 * matches a real account — see `requestPasswordReset` for the threat
 * model.
 */
export const metadata = { title: "相聚 · 找回帳號 / 密碼" };

export default function ForgotPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link
            href="/login"
            className="text-xs text-ink/55 hover:text-terracotta"
          >
            ← 回登入
          </Link>
          <h1 className="serif text-3xl text-ink mt-3">找回帳號或密碼</h1>
          <p className="text-ink/60 text-sm mt-2">
            輸入註冊時填的 Email，我們會把連結 / 帳號寄到你的信箱。
          </p>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          <ForgotForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink/45">
          <Link href="/preview" className="hover:text-terracotta">先看看 → /preview</Link>
        </p>
      </div>
    </main>
  );
}
