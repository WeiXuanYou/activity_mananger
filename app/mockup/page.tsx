import Link from "next/link";

type Screen = {
  href: string;
  title: string;
  group: "入口" | "社群核心" | "自訂頁面" | "權限" | "分析";
  desc: string;
  preview: string;
};

const screens: Screen[] = [
  { href: "/mockup/login", title: "登入（邀請碼）", group: "入口", desc: "封閉社群只有受邀者能進", preview: "🔑" },
  { href: "/mockup/feed", title: "動態首頁（含分類篩選）", group: "社群核心", desc: "活動、文章、投票混合 + 分類切換", preview: "🏠" },
  { href: "/mockup/activity", title: "活動詳情", group: "社群核心", desc: "RSVP + 內嵌投票 + 留言", preview: "🍖" },
  { href: "/mockup/poll", title: "Line 風格投票", group: "社群核心", desc: "倒數截止、單/多選、匿名、可新增選項", preview: "📊" },
  { href: "/mockup/create", title: "建立內容（含置頂、分類）", group: "社群核心", desc: "Post / Activity / Poll + 置頂 + 分類選擇", preview: "✏️" },
  { href: "/mockup/pages", title: "自訂頁面書架", group: "自訂頁面", desc: "成員建立的 CMS 頁面集合", preview: "📚" },
  { href: "/mockup/page-detail", title: "自訂頁面範例", group: "自訂頁面", desc: "多種 block 渲染示範", preview: "📖" },
  { href: "/mockup/permissions", title: "權限申請", group: "權限", desc: "申請更高權限的表單", preview: "🛡️" },
  { href: "/mockup/inbox", title: "管理員收件夾", group: "權限", desc: "審批待處理的權限申請", preview: "📥" },
  { href: "/mockup/analytics", title: "分析儀表板", group: "分析", desc: "獨立模組——視覺刻意區隔", preview: "📈" },
  { href: "/mockup/profile", title: "成員檔案", group: "社群核心", desc: "個人活動、文章、頁面", preview: "👤" },
];

const groups: Screen["group"][] = ["入口", "社群核心", "自訂頁面", "權限", "分析"];

export default function MockupIndex() {
  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-sage-dark font-medium tracking-widest text-xs mb-2">PHASE A · INTERACTIVE MOCKUP</p>
          <h1 className="serif text-5xl text-ink mb-3">相聚 · 視覺原型</h1>
          <p className="text-ink/70 max-w-2xl">
            點選任一畫面進入。所有頁面為純前端假資料，已模組化（<code className="text-terracotta">modules/</code>）。
            看完整體流程後即可進入 Phase B（認證 + 權限骨架）。
          </p>
        </div>

        <div className="space-y-10">
          {groups.map((group) => {
            const items = screens.filter((s) => s.group === group);
            return (
              <section key={group}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="serif text-2xl text-ink">{group}</h2>
                  <div className="flex-1 divider-dashed" />
                  <span className="text-xs text-ink/40">{items.length} 個畫面</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="bg-white rounded-soft border border-sand/60 shadow-card p-5 hover:shadow-soft hover:-translate-y-0.5 transition"
                    >
                      <div className="text-4xl mb-3">{s.preview}</div>
                      <h3 className="serif text-lg text-ink mb-1">{s.title}</h3>
                      <p className="text-sm text-ink/60 mb-3">{s.desc}</p>
                      <span className="text-xs text-terracotta font-medium">{s.href} →</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-16 pt-6 border-t border-sand text-sm text-ink/50 flex flex-wrap gap-4">
          <span>Next.js 15 · Tailwind · TypeScript</span>
          <span>·</span>
          <span>架構：modules/ (core / analytics / custom-pages / permissions / auth)</span>
          <span className="ml-auto"><Link href="/" className="hover:text-terracotta">← 回首頁</Link></span>
        </footer>
      </div>
    </main>
  );
}
