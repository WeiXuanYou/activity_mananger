import Link from "next/link";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { formatShortDate, relativeFromNow } from "@/lib/date";

/**
 * Real DB-backed feed. Proves the Phase B end-to-end pipeline:
 *
 *   browser → middleware (cookie check) → AppLayout (session lookup)
 *   → page (real query via @/lib/db) → render
 *
 * Modules used: auth (session), permissions (canCurrentUser), Prisma (db).
 */
export default async function AppFeedPage() {
  const me = await requireCurrentUser();
  const canPost = await canCurrentUser("post.create");
  const canCreateActivity = await canCurrentUser("activity.create");
  const canViewAnalytics = await canCurrentUser("analytics.view");

  const [posts, activities, polls] = await Promise.all([
    db.post.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: true,
        categories: { include: { category: true } },
      },
      take: 10,
    }),
    db.activity.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: {
        author: true,
        categories: { include: { category: true } },
        participants: true,
      },
      take: 5,
    }),
    db.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        options: { include: { votes: true } },
        categories: { include: { category: true } },
      },
      take: 3,
    }),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-5 py-6">
      <div className="mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">REAL DB · /app</p>
            <h1 className="serif text-3xl text-ink">嗨，{me.name}</h1>
            <p className="text-ink/60 text-sm mt-1">
              你的角色：<strong className="text-ink/80">{me.role.name}</strong> ·
              權限：{me.role.permissions.length} 項
            </p>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap text-xs">
            <PermPill label="post.create"     allowed={canPost} />
            <PermPill label="activity.create" allowed={canCreateActivity} />
            <PermPill label="analytics.view"  allowed={canViewAnalytics} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-5">
          <div className="bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/65 leading-relaxed">
            <strong className="text-ink/80">↓ 以下所有資料都來自 Prisma 查詢 SQLite</strong>——
            重新整理時會重新拉取。試試 <code className="text-terracotta">npx prisma studio</code> 編輯資料。
          </div>

          <h2 className="serif text-xl text-ink">📌 最新文章 ({posts.length})</h2>
          <div className="space-y-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className={`rounded-soft border p-5 ${
                  p.isPinned
                    ? "bg-gradient-to-br from-terracotta-soft/30 to-cream border-terracotta/30 shadow-soft"
                    : "bg-white shadow-card border-sand/60"
                }`}
              >
                {p.isPinned && (
                  <div className="text-xs text-terracotta-dark font-medium mb-2">📌 由管理員置頂</div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full text-white text-xs flex items-center justify-center"
                    style={{ background: p.author.avatarColor }}
                  >
                    {p.author.initial}
                  </div>
                  <span className="text-sm font-medium text-ink">{p.author.name}</span>
                  <span className="text-xs text-ink/50">
                    {new Date(p.createdAt).toLocaleDateString("zh-TW")}
                  </span>
                  <span className="ml-auto text-xs text-sage-dark bg-sage/10 px-2 py-0.5 rounded-full">
                    {p.kind}
                  </span>
                </div>
                {p.title && <h3 className="serif text-lg text-ink mb-1">{p.title}</h3>}
                <p className="text-sm text-ink/75 leading-relaxed">{p.body}</p>
                <div className="flex gap-1.5 mt-3">
                  {p.categories.map((pc) => (
                    <span key={pc.categoryId} className="text-[10px] bg-cream px-1.5 py-0.5 rounded">
                      {pc.category.emoji} {pc.category.name}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-base text-ink mb-3">🗓 即將到來</h3>
            {activities.length === 0 && <p className="text-sm text-ink/55">沒有未來的活動</p>}
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="border-b border-sand pb-3 last:border-0">
                  <div className="text-xs text-terracotta font-medium">
                    {formatShortDate(a.startsAt.toISOString().slice(0, 10))} · {relativeFromNow(a.startsAt.toISOString().slice(0, 10))}
                  </div>
                  <div className="text-sm text-ink font-medium">{a.title}</div>
                  <div className="text-xs text-ink/55">
                    📍 {a.location} · {a.participants.filter((p) => p.status === "GOING").length} 人參加
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-base text-ink mb-3">📊 投票</h3>
            <div className="space-y-3">
              {polls.map((p) => {
                const total = p.options.reduce((s, o) => s + o.votes.length, 0);
                return (
                  <div key={p.id} className="border-b border-sand pb-3 last:border-0">
                    <div className="text-sm font-medium text-ink mb-1">{p.question}</div>
                    <div className="text-xs text-ink/55 mb-2">{total} 票</div>
                    {p.options.map((o) => {
                      const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
                      return (
                        <div key={o.id} className="mb-1">
                          <div className="flex justify-between text-xs">
                            <span>{o.label}</span>
                            <span className="text-ink/50">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                            <div className="h-full bg-terracotta-soft" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-cream/40 rounded-soft border border-sand p-5 text-xs text-ink/65 leading-relaxed">
            <strong className="text-ink/80">💡 Phase B 已啟用：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>✅ Prisma + SQLite schema 完整</li>
              <li>✅ 邀請碼登入 + 簽名 cookie session</li>
              <li>✅ <code>requirePermission()</code> 真的會 throw</li>
              <li>⬜ Phase C：所有社群核心 server actions 接 DB</li>
            </ul>
            <p className="mt-2">
              <Link href="/mockup" className="text-terracotta hover:underline">→ 看 mockup 完整設計</Link>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function PermPill({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full font-mono ${
        allowed ? "bg-sage-soft/60 text-sage-dark" : "bg-sand/60 text-ink/40"
      }`}
      title={allowed ? "你有這個權限" : "你沒有這個權限"}
    >
      {allowed ? "✓" : "✕"} {label}
    </span>
  );
}
