import Link from "next/link";
import { LoginForm } from "./LoginForm";

/**
 * Login is now mode-agnostic — demo / production look the same. No
 * default credentials, demo invite codes, or feature flags leak onto
 * this surface; operators read the README for first-time setup. The
 * /preview tour link sits at the bottom so visitors can still browse
 * the visual prototype without signing in.
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-terracotta-soft flex items-center justify-center text-3xl shadow-soft">
              🏡
            </div>
          </div>
          <h1 className="serif text-3xl text-ink mb-1">歡迎回到相聚</h1>
          <p className="text-xs tracking-widest text-sage-dark mb-2">TOGETHER</p>
          <p className="text-ink/60 text-sm">
            用你的帳號登入，第一次來請用邀請碼註冊
          </p>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink/45">
          <Link href="/preview" className="hover:text-terracotta">想先看看？→ 全站預覽 /preview</Link>
        </p>
      </div>
    </main>
  );
}
