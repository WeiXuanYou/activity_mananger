import Link from "next/link";

/**
 * /preview — a single-page visual tour of every screen in the app.
 *
 * Thumbnails are static PNGs captured into /public/preview (regenerate
 * with `node gen-preview.mjs` against a running server). Grouped into
 * three sections: public entry, the design mockup, and the live app.
 *
 * Each card links to the *live* route where one exists, so this doubles
 * as a clickable site map.
 */
export const metadata = { title: "相聚 · 全站預覽" };

type Shot = { img: string; title: string; desc: string; href?: string };

const PUBLIC: Shot[] = [
  { img: "landing", title: "首頁 Landing", desc: "品牌入口 + 三大功能介紹", href: "/" },
  { img: "login", title: "邀請碼登入", desc: "封閉社群，只有受邀者能進", href: "/login" },
];

const APP: Shot[] = [
  { img: "app-feed", title: "動態首頁", desc: "📅 去年的今天 widget + 文章 + 即將到來 + 進行中投票 + 搜尋列", href: "/app/feed" },
  { img: "app-search", title: "全站搜尋", desc: "跨文章/活動/投票/頁面/留言 + 命中高亮", href: "/app/search" },
  { img: "app-activities", title: "活動列表", desc: "下次相聚 hero + 即將/已過去 + 分類", href: "/app/activities" },
  { img: "app-activity", title: "活動詳情", desc: "RSVP + 💰 分帳結算 + 留言串 + 分類 + 編輯/刪除", href: "/app/activities" },
  { img: "app-expenses", title: "聚會分帳", desc: "活動下記支出 → 自動算每人應付/應收（平均分攤）", href: "/app/activities" },
  { img: "app-photo-album-edit", title: "📷 相簿 block", desc: "CMS 頁面新 block 類型，多圖網格 + 標題編輯", href: "/app/pages" },
  { img: "app-mobile-feed", title: "📱 手機版動態", desc: "compact header + 漢堡 menu drawer", href: "/app/feed" },
  { img: "app-mobile-menu", title: "📱 手機 menu drawer", desc: "全螢幕側拉，所有 nav 都在這", href: "/app/feed" },
  { img: "app-activity-edit", title: "編輯活動", desc: "預填的活動表單，owner 或 moderator 可改", href: "/app/activities" },
  { img: "app-calendar", title: "行事曆", desc: "月曆檢視所有活動", href: "/app/calendar" },
  { img: "app-activities-new", title: "建立活動", desc: "含封面圖片上傳 / 漸層挑選", href: "/app/activities/new" },
  { img: "app-polls-new", title: "建立投票", desc: "一般 / 📅 排程兩種模式 · Line 風格 · 多選/匿名/可新增", href: "/app/polls/new" },
  { img: "app-poll", title: "投票詳情", desc: "排程投票顯示 👑 共同最佳時段 · 即時計票 + 倒數", href: "/app/feed" },
  { img: "app-poll-edit", title: "編輯投票", desc: "有人投過就鎖定選項，只能改設定/截止", href: "/app/feed" },
  { img: "app-posts-new", title: "發文", desc: "文章/推薦/隨筆 + 分類 + 置頂", href: "/app/posts/new" },
  { img: "app-pages", title: "自訂頁面書架", desc: "成員建立的 CMS 頁面", href: "/app/pages" },
  { img: "app-page-detail", title: "自訂頁面內容", desc: "RichText / Markdown / HTML / 圖片 / 嵌入投票", href: "/app/pages" },
  { img: "app-page-edit", title: "CMS 編輯模式", desc: "block 工具列（↑↓🗑）+ 加入新 block 的工具列", href: "/app/pages" },
  { img: "app-pages-new", title: "建立自訂頁面", desc: "Markdown 起手 + 分類", href: "/app/pages/new" },
  { img: "app-profile", title: "個人檔案", desc: "頭像 + 統計（文章/活動/投票/留言）+ 內容列表", href: "/app/feed" },
  { img: "app-assistant", title: "AI 助手", desc: "草擬投票/活動、分類、摘要（接 Claude / Ollama / 任何 OpenAI-compat）", href: "/app/assistant" },
  { img: "app-assistant-cta", title: "AI 一鍵建立", desc: "AI 草稿 → ✓ 用這份草稿建立投票/活動，prefill 進真實表單", href: "/app/assistant" },
  { img: "app-permissions", title: "權限申請", desc: "角色階梯 + 申請 + 管理員審批", href: "/app/permissions" },
  { img: "app-admin", title: "管理工具", desc: "邀請碼 / 角色管理 / 審計日誌", href: "/app/admin" },
  { img: "app-analytics", title: "分析儀表板", desc: "事件流（獨立模組、深色介面）", href: "/app/analytics" },
  { img: "app-notifications", title: "通知", desc: "站內提醒（核准/留言/RSVP）", href: "/app/notifications" },
];

const MOCKUP: Shot[] = [
  { img: "mockup-index", title: "Mockup 索引", desc: "視覺原型總覽", href: "/mockup" },
  { img: "mockup-feed", title: "動態（設計稿）", desc: "暖色家庭相簿風", href: "/mockup/feed" },
  { img: "mockup-activities", title: "活動列表（設計稿）", desc: "", href: "/mockup/activities" },
  { img: "mockup-activity", title: "活動詳情（設計稿）", desc: "", href: "/mockup/activity" },
  { img: "mockup-poll", title: "投票（設計稿）", desc: "Line 風格倒數", href: "/mockup/poll" },
  { img: "mockup-create", title: "建立內容（設計稿）", desc: "", href: "/mockup/create" },
  { img: "mockup-pages", title: "頁面書架（設計稿）", desc: "", href: "/mockup/pages" },
  { img: "mockup-page-detail", title: "頁面內容（設計稿）", desc: "", href: "/mockup/page-detail" },
  { img: "mockup-permissions", title: "權限（設計稿）", desc: "", href: "/mockup/permissions" },
  { img: "mockup-inbox", title: "管理員收件夾（設計稿）", desc: "", href: "/mockup/inbox" },
  { img: "mockup-analytics", title: "分析（設計稿）", desc: "", href: "/mockup/analytics" },
  { img: "mockup-assistant", title: "AI 助手（設計稿）", desc: "", href: "/mockup/assistant" },
  { img: "mockup-profile", title: "個人檔案（設計稿）", desc: "", href: "/mockup/profile" },
];

function Grid({ shots }: { shots: Shot[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {shots.map((s) => {
        const card = (
          <div className="group bg-white rounded-soft border border-sand/60 shadow-card overflow-hidden hover:shadow-soft hover:-translate-y-0.5 transition">
            <div className="aspect-[1280/820] overflow-hidden bg-cream/40 border-b border-sand/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/preview/${s.img}.png`}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition"
              />
            </div>
            <div className="p-3">
              <div className="text-sm font-medium text-ink group-hover:text-terracotta transition">{s.title}</div>
              {s.desc && <div className="text-xs text-ink/55 mt-0.5 leading-snug">{s.desc}</div>}
            </div>
          </div>
        );
        return s.href ? (
          <Link key={s.img} href={s.href}>{card}</Link>
        ) : (
          <div key={s.img}>{card}</div>
        );
      })}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-sage-dark font-medium tracking-widest text-xs mb-2">FULL SITE PREVIEW</p>
          <h1 className="serif text-5xl text-ink mb-3">相聚 · 全站預覽</h1>
          <p className="text-ink/70 max-w-2xl leading-relaxed">
            一頁看完整個網站長什麼樣子。點任一張縮圖會跳到該頁。
            真實 App 頁面需要先用邀請碼登入（
            <Link href="/login" className="text-terracotta hover:underline">/login</Link>，
            demo 碼見登入頁）。
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/login" className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
              登入體驗 →
            </Link>
            <Link href="/mockup" className="px-5 py-2.5 rounded-soft bg-white border border-sand text-ink hover:bg-cream/50 transition">
              看設計稿
            </Link>
          </div>
        </div>

        <Section label="入口" count={PUBLIC.length}><Grid shots={PUBLIC} /></Section>
        <Section label="真實應用 App（需登入）" count={APP.length}><Grid shots={APP} /></Section>
        <Section label="設計稿 Mockup（純前端假資料）" count={MOCKUP.length}><Grid shots={MOCKUP} /></Section>

        <TechStack />

        <footer className="mt-16 pt-6 border-t border-sand text-sm text-ink/50">
          相聚 Together · {PUBLIC.length + APP.length + MOCKUP.length} 個畫面 ·
          縮圖以 <code className="text-terracotta">node gen-preview.mjs</code> 重新產生
        </footer>
      </div>
    </main>
  );
}

/**
 * Technical stack callout. Lives only on /preview because end users
 * shouldn't see "we use Prisma" on their feed — but operators / devs /
 * curious self-hosters absolutely should be able to find this in one place.
 */
function TechStack() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="serif text-2xl text-ink">技術細節</h2>
        <div className="flex-1 divider-dashed" />
        <span className="text-xs text-ink/40">給想自架的人看</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TechCard title="📦 核心框架">
          <ul className="space-y-1">
            <li><strong>Next.js 15</strong> · App Router · Server Components + Server Actions</li>
            <li><strong>TypeScript</strong>（嚴格模式）</li>
            <li><strong>Tailwind CSS</strong> + 自家 design tokens（暖色家庭相簿風）</li>
            <li><strong>React 19</strong></li>
          </ul>
        </TechCard>
        <TechCard title="🗄 資料 & 持久化">
          <ul className="space-y-1">
            <li><strong>SQLite</strong> + <strong>Prisma</strong> ORM（一個檔案就跑得動，適合家人朋友規模）</li>
            <li><strong>Prisma Migrations</strong> 版本化 schema：開發 <code className="bg-cream/60 px-1 rounded">db:migrate</code>，正式 <code className="bg-cream/60 px-1 rounded">db:deploy</code>（不洗資料）</li>
            <li>頭像直接以 base64 inline 存在 User row（家庭規模毋須 blob storage）</li>
            <li>規模長大可平移到 Postgres：只改 <code className="bg-cream/60 px-1 rounded">DATABASE_URL</code> 與 provider</li>
          </ul>
        </TechCard>
        <TechCard title="🔐 身份與安全">
          <ul className="space-y-1">
            <li>Cookie session（30 天 TTL，DB 只存 SHA-256 hash）</li>
            <li>密碼：Node <code className="bg-cream/60 px-1 rounded">scrypt</code>（加鹽 + 等時比對）</li>
            <li><strong>登入防爆力</strong>：依 client IP 限流（10 次失敗 / 15 分鐘）</li>
            <li><strong>找回密碼 / 帳號</strong>：一次性 token、1 小時有效、SHA-256 in DB、不洩漏帳號存在</li>
            <li>邀請碼一次性 + 角色（Guest / Member / Editor / Admin）+ 細粒度權限</li>
          </ul>
        </TechCard>
        <TechCard title="✉️ Email & AI（可選）">
          <ul className="space-y-1">
            <li>寄信走 <strong>Resend API</strong>（設 <code className="bg-cream/60 px-1 rounded">RESEND_API_KEY</code>）；不設則寫進 server log，方便自架時手動轉發</li>
            <li>AI 助手相容 OpenAI 介面：<strong>Anthropic Claude</strong> / 本機 <strong>Ollama</strong> / 任何 OpenAI-compat 端點皆可</li>
            <li>正式環境環境變數：<code className="bg-cream/60 px-1 rounded">DATABASE_URL</code>、<code className="bg-cream/60 px-1 rounded">SESSION_SECRET</code>、<code className="bg-cream/60 px-1 rounded">APP_URL</code>、<code className="bg-cream/60 px-1 rounded">RESEND_API_KEY</code>、<code className="bg-cream/60 px-1 rounded">MAIL_FROM</code></li>
          </ul>
        </TechCard>
      </div>
      <p className="mt-4 text-xs text-ink/50">
        詳細部署說明見 repo 的 <code className="bg-cream/60 px-1 rounded">README.md</code> 與 <code className="bg-cream/60 px-1 rounded">modules/auth/README.md</code>。
      </p>
    </section>
  );
}

function TechCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-soft border border-sand/60 shadow-card p-5">
      <h3 className="serif text-lg text-ink mb-3">{title}</h3>
      <div className="text-sm text-ink/75 leading-relaxed">{children}</div>
    </div>
  );
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="serif text-2xl text-ink">{label}</h2>
        <div className="flex-1 divider-dashed" />
        <span className="text-xs text-ink/40">{count} 個畫面</span>
      </div>
      {children}
    </section>
  );
}
