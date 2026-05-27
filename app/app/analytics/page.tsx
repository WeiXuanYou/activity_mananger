import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { Avatar } from "@/modules/core/members";
import {
  computeKpisDb,
  eventsByKindDb,
  recentEventsDb,
  topContributorsDb,
  eventsByHourDb,
  KpiCard,
} from "@/modules/analytics";

/**
 * Real analytics dashboard (Phase E).
 *
 * Gated by `analytics.view` permission. Reads exclusively from the
 * `AnalyticsEvent` table — never JOINs into core tables. That's the
 * firewall that lets this whole module be lifted out later.
 *
 * Visual style is deliberately distinct (slate header) to signal the
 * module boundary at a glance.
 */
export default async function AppAnalyticsPage() {
  await requireCurrentUser();
  const allowed = await canCurrentUser("analytics.view");
  if (!allowed) redirect("/app/feed?denied=analytics");

  const [kpis, byKind, recent, topContrib, byHour] = await Promise.all([
    computeKpisDb(),
    eventsByKindDb(),
    recentEventsDb(20),
    topContributorsDb(30),
    eventsByHourDb(),
  ]);

  const totalEvents = byKind.reduce((s, r) => s + r.count, 0);

  return (
    <div className="bg-slate-50 min-h-screen -mt-px">
      <header className="bg-slate-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">ANALYTICS MODULE</span>
            <Link href="/app/feed" className="text-sm text-white/60 hover:text-white">相聚 ·</Link>
            <span className="serif text-xl">分析</span>
            <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-medium ml-2">
              ● Phase E · Live Events
            </span>
          </div>
          <Link href="/app/feed" className="ml-auto text-xs text-white/60 hover:text-white">
            ← 回主應用
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-ink mb-1">事件總覽</h1>
          <p className="text-sm text-slate-500">
            來自 <code className="bg-white px-1 rounded">AnalyticsEvent</code> 表 ·
            目前共 <strong className="text-slate-ink">{totalEvents}</strong> 筆事件
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Hourly trend */}
          <div className="lg:col-span-2 bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-ink">過去 24 小時事件量</h3>
              <span className="text-xs text-slate-500">
                {byHour.reduce((s, n) => s + n, 0)} 筆
              </span>
            </div>
            <div className="h-32 flex items-end gap-1 border-b border-slate-200">
              {byHour.map((count, i) => {
                const max = Math.max(...byHour, 1);
                const pct = (count / max) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-slate-ink rounded-t hover:bg-terracotta transition"
                    style={{ height: `${pct}%`, minHeight: count > 0 ? "4px" : "0" }}
                    title={`${count} events`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>-24h</span>
              <span>-12h</span>
              <span>now</span>
            </div>
          </div>

          {/* By kind */}
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">事件類型分布</h3>
            {byKind.length === 0 ? (
              <p className="text-sm text-slate-500">尚無事件</p>
            ) : (
              <div className="space-y-2">
                {byKind.map((b) => {
                  const pct = (b.count / totalEvents) * 100;
                  return (
                    <div key={b.kind}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <code className="text-slate-700">{b.kind}</code>
                        <span className="text-slate-500">{b.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-ink" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top contributors */}
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-1">最活躍成員（過去 30 天）</h3>
            <p className="text-xs text-slate-500 mb-3">依事件總數排名</p>
            {topContrib.length === 0 ? (
              <p className="text-sm text-slate-500">尚無資料</p>
            ) : (
              <div className="space-y-3">
                {topContrib.map((t, i) => {
                  const max = topContrib[0]?.score ?? 1;
                  return (
                    <div key={t.member.id} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                      <Avatar member={t.member} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-ink truncate">{t.member.name}</div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-slate-ink" style={{ width: `${(t.score / max) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{t.score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live event log */}
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-ink">即時事件流</h3>
              <span className="text-[10px] text-emerald-600 font-medium animate-pulse">● LIVE</span>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">尚無事件——去 /app/feed 投幾票或發篇文吧</p>
            ) : (
              <ul className="space-y-1.5 text-xs max-h-72 overflow-y-auto">
                {recent.map((e) => (
                  <li key={e.id} className="flex items-baseline gap-2 border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] text-slate-400 w-12 shrink-0">
                      {timeAgo(e.createdAt)}
                    </span>
                    {e.actor && (
                      <span className="text-slate-ink shrink-0">{e.actor.name}</span>
                    )}
                    <code className="text-terracotta">{e.kind}</code>
                    <span className="text-slate-500 truncate">{e.subjectType}:{e.subjectId.slice(-6)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-slate-ink/5 rounded-soft border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-ink">模組邊界：</strong>
          這個儀表板只讀 <code className="bg-white px-1 rounded">AnalyticsEvent</code> 表，
          不 JOIN core。Core 模組的 server actions 透過 <code className="bg-white px-1 rounded">analytics.emit()</code> 單向寫入事件——
          所以分析模組可以隨時抽出獨立服務。
        </div>
      </main>
    </div>
  );
}

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}
