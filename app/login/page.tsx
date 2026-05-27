import Link from "next/link";
import { LoginForm } from "./LoginForm";

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
          <p className="text-ink/60 text-sm">輸入你的邀請碼開始使用</p>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          <LoginForm />

          <div className="mt-5 pt-5 border-t border-sand">
            <p className="text-xs text-ink/55 mb-2 font-medium">🎟 開發 / Demo 邀請碼</p>
            <ul className="text-xs text-ink/60 space-y-1 font-mono">
              <li><code className="bg-cream/60 px-1.5 py-0.5 rounded">TOGETHER-DEMO-MEMBER</code> → Member</li>
              <li><code className="bg-cream/60 px-1.5 py-0.5 rounded">TOGETHER-DEMO-EDITOR</code> → Editor</li>
              <li><code className="bg-cream/60 px-1.5 py-0.5 rounded">TOGETHER-DEMO-ADMIN</code>  → Admin（可看分析）</li>
              <li><code className="bg-cream/60 px-1.5 py-0.5 rounded">TOGETHER-DEMO-GUEST</code>  → Guest</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          <Link href="/mockup" className="hover:text-terracotta">想先看 Mockup？→ /mockup</Link>
        </p>
      </div>
    </main>
  );
}
