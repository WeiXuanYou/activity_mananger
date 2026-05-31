import Link from "next/link";
import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";

/**
 * Detect whether this install is the public demo by looking for a
 * known demo invite code. Production seeds don't create these, so the
 * page can adapt UX automatically without an extra env var.
 *
 * Note: even in demo mode we no longer print the demo invite codes or
 * admin/admin hint on this page — that info lives in the README so
 * the login surface stays free of credentials.
 */
async function detectDemoMode(): Promise<boolean> {
  const code = await db.inviteCode.findUnique({
    where: { code: "TOGETHER-DEMO-MEMBER" },
    select: { id: true },
  });
  return Boolean(code);
}

export default async function LoginPage() {
  const isDemo = await detectDemoMode();

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

        {isDemo && (
          <p className="mt-6 text-center text-xs text-ink/40">
            <Link href="/mockup" className="hover:text-terracotta">想先看 Mockup？→ /mockup</Link>
          </p>
        )}
      </div>
    </main>
  );
}
