import Link from "next/link";
import { verifyEmailAction } from "@/modules/auth/actions";

/**
 * Public landing page for the verification link sent by
 * `requestEmailVerification`. Runs the consume action server-side and
 * renders success / failure copy. No auth required — the token itself
 * is the proof.
 */
export const metadata = { title: "相聚 · 確認 Email" };

type Search = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Search) {
  const sp = await searchParams;
  const token = (sp.token ?? "").trim();

  let body: React.ReactNode;
  if (!token) {
    body = <ErrorPanel msg="這個連結缺少必要的參數。請從 Email 裡的連結重新點進來。" />;
  } else {
    const r = await verifyEmailAction(token);
    if (r.ok) {
      body = (
        <SuccessPanel>
          <div className="text-3xl mb-3">🎉</div>
          <p className="serif text-xl text-ink mb-2">Email 確認成功！</p>
          <p className="text-ink/65 text-sm">
            未來忘記密碼或帳號時，我們會透過這個信箱找回你。
          </p>
        </SuccessPanel>
      );
    } else {
      const map = {
        INVALID:       "這個確認連結無效。請從帳戶設定重新寄一封驗證信。",
        EXPIRED:       "這個確認連結已過期（24 小時內有效）。請重新寄一次。",
        USED:          "這個連結已經被使用過了。你的 Email 應該已經驗證好了。",
        EMAIL_CHANGED: "你的 Email 已經改過了，這個連結屬於舊的地址。請從帳戶設定寄一封新的驗證信。",
      };
      body = <ErrorPanel msg={map[r.reason]} />;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="serif text-3xl text-ink">確認 Email</h1>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7 text-center">
          {body}
        </div>

        <p className="mt-6 text-center text-xs text-ink/45">
          <Link href="/login" className="hover:text-terracotta">回登入 →</Link>
          <span className="mx-2">·</span>
          <Link href="/app/account" className="hover:text-terracotta">帳戶設定</Link>
        </p>
      </div>
    </main>
  );
}

function SuccessPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sage-soft/30 border border-sage/30 rounded-soft p-5 text-sage-dark">
      {children}
    </div>
  );
}

function ErrorPanel({ msg }: { msg: string }) {
  return (
    <div className="text-sm text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-3">
      <div className="text-2xl mb-2">⚠</div>
      {msg}
    </div>
  );
}
