import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-terracotta-soft/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sage-soft/50 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-cream rounded-full blur-2xl opacity-60" />

      <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur px-4 py-1.5 rounded-full text-xs text-sage-dark font-medium tracking-widest mb-5 shadow-card">
            <span>♡</span> FOR FAMILY · FOR FRIENDS · TOGETHER
          </div>
          <h1 className="serif text-6xl md:text-7xl text-ink leading-tight mb-2">
            相聚
          </h1>
          <p className="text-xs tracking-[0.4em] text-ink/40 mb-5">T O G E T H E R</p>
          <p className="serif text-xl text-ink/75 mb-2">
            把心愛的人聚在一起
          </p>
          <p className="text-ink/65 leading-relaxed mb-8 max-w-lg mx-auto">
            一個給家人與朋友的私密小社群——辦活動、發起投票、寫文章、留下回憶。<br/>
            不用追蹤誰、不用比讚數，只有自己人，慢慢說話。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/mockup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-soft bg-terracotta text-white font-medium shadow-soft hover:bg-terracotta-dark transition"
            >
              進入 Mockup 預覽 <span>→</span>
            </Link>
            <Link
              href="/mockup/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-soft bg-white text-ink border border-sand hover:bg-cream/50 transition"
            >
              我已有邀請碼
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Feature icon="🍖" title="辦一場聚會" desc="家族烤肉、生日派對、同學會、週末爬山——把日期、地點、參加名單與待辦清單放在一起。" />
          <Feature icon="📊" title="像 Line 的投票" desc="單選、多選、匿名、可由家人朋友補選項、自動截止——徵詢意見再也不用一個一個問。" />
          <Feature icon="🏷" title="分類好找好整理" desc="預設分類 + 自訂分類，所有內容都能標籤、篩選、回顧。家人朋友的事一目了然。" />
        </div>

        <p className="mt-12 text-center text-ink/45 text-sm">
          Phase A · 純前端互動原型（尚未接資料庫）
        </p>
      </div>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-soft border border-sand/60 shadow-card p-5">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="serif text-lg text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink/65 leading-relaxed">{desc}</p>
    </div>
  );
}
