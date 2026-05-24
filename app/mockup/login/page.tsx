import Link from "next/link";

export default function LoginMockup() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-full bg-terracotta-soft flex items-center justify-center text-3xl shadow-soft">
              🏡
            </div>
          </div>
          <h1 className="serif text-3xl text-ink mb-2">歡迎回到家圈</h1>
          <p className="text-ink/60 text-sm">輸入你的邀請碼開始使用</p>
        </div>

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          <label className="block">
            <span className="text-sm font-medium text-ink/80">邀請碼</span>
            <input
              type="text"
              placeholder="例如：FAMILY-2026-A8K3"
              defaultValue="FAMILY-2026-A8K3"
              className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/40 focus:outline-none focus:border-terracotta font-mono tracking-wider"
            />
          </label>

          <p className="mt-3 text-xs text-ink/50 leading-relaxed">
            還沒有邀請碼嗎？請聯絡邀請你的家人或朋友取得；初次加入後預設為一般成員權限。
          </p>

          <Link
            href="/mockup/feed"
            className="mt-5 block w-full text-center px-4 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            進入家圈 →
          </Link>

          <div className="mt-5 pt-5 border-t border-sand text-center">
            <p className="text-xs text-ink/50">
              想加入但找不到邀請人？
              <a href="#" className="text-terracotta hover:underline ml-1">寫信給管理員</a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          <Link href="/mockup" className="hover:text-terracotta">← 回到 Mockup 索引</Link>
        </p>
      </div>
    </main>
  );
}
