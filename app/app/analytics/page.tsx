import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { Avatar } from "@/modules/core/members";
import {
  listUpcomingActivitiesDb,
  listPastActivitiesDb,
} from "@/modules/core/activities";
import { listPollsDb } from "@/modules/core/polls";
import {
  computeKpisDb,
  eventsByKindDb,
  recentEventsDb,
  topContributorsDb,
  eventsByHourDb,
  KpiCard,
} from "@/modules/analytics";

/**
 * Analytics page — two tiers:
 *
 * 1. Everyone gets a "活動洞察" view: lightweight per-activity trends
 *    (RSVP split, poll participation) computed from core listings.
 * 2. Admins additionally see the full event-stream dashboard powered
 *    by the analytics module (KPIs, hourly chart, kind breakdown, live
 *    feed, top contributors). Plus a link into /app/admin for the
 *    "more detailed management" surface.
 *
 * The two tiers are rendered on the same route so members never hit
 * a 403; the admin block simply doesn't render for non-admins.
 */
export default async function AppAnalyticsPage() {
  await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");

  const [upcoming, past, polls] = await Promise.all([
    listUpcomingActivitiesDb(),
    listPastActivitiesDb(),
    listPollsDb(),
  ]);

  // Combined activity roll-up. Sort by total RSVP interest (going+maybe).
  const activities = [...upcoming, ...past]
    .map((a) => {
      const total = a.rsvp.going + a.rsvp.maybe + a.rsvp.declined;
      return { ...a, total };
    })
    .sort((a, b) => (b.rsvp.going + b.rsvp.maybe) - (a.rsvp.going + a.rsvp.maybe))
    .slice(0, 12);

  const totalGoing = activities.reduce((s, a) => s + a.rsvp.going, 0);
  const totalVotes = polls.reduce((s, p) => s + p.totalVotes, 0);

  return (
    <main className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ANALYTICS</p>
        <h1 className="serif text-3xl text-ink">活動洞察</h1>
        <p className="text-ink/60 text-sm mt-1">
          看看大家對哪些活動最有興趣、哪些投票最熱絡。
          {isAdmin && " 你是管理員，下方還有完整的事件儀表板。"}
        </p>
      </div>

      {/* Member-friendly tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile label="活動數" value={String(upcoming.length + past.length)} hint={`即將到來 ${upcoming.length}`} />
        <StatTile label="RSVP（會去）" value={String(totalGoing)} hint="所有活動加總" />
        <StatTile label="投票數" value={String(polls.length)} hint={`累積選票 ${totalVotes}`} />
        <StatTile label="累積選票" value={String(totalVotes)} hint="跨所有投票" />
      </div>

      {/* Per-activity trends */}
      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-5 mb-8">
        <h2 className="serif text-xl text-ink mb-1">每個活動的熱度</h2>
        <p className="text-sm text-ink/60 mb-4">
          以 RSVP（會去 + 可能）排序，數字越多代表家人朋友越有興趣。
        </p>
        {activities.length === 0 ? (
          <p className="text-sm text-ink/50">還沒有活動。<Link href="/app/activities/new" className="text-terracotta hover:underline">建一個新的</Link>看看？</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => {
              const interest = a.rsvp.going + a.rsvp.maybe;
              const max = Math.max(...activities.map((x) => x.rsvp.going + x.rsvp.maybe), 1);
              const pct = (interest / max) * 100;
              return (
                <Link
                  key={a.id}
                  href={`/app/activity/${a.id}`}
                  className="block group"
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm text-ink group-hover:text-terracotta truncate flex-1">{a.title}</span>
                    <span className="text-xs text-ink/55 tabular-nums shrink-0">
                      {a.rsvp.going} 去 · {a.rsvp.maybe} 可能 · {a.rsvp.declined} 不去
                    </span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden flex">
                    <div className="bg-terracotta" style={{ width: `${(a.rsvp.going / max) * 100}%` }} />
                    <div className="bg-sage" style={{ width: `${(a.rsvp.maybe / max) * 100}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Top polls — quick glance */}
      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-5 mb-8">
        <h2 className="serif text-xl text-ink mb-1">最熱投票</h2>
        <p className="text-sm text-ink/60 mb-4">依累積選票排序。</p>
        {polls.length === 0 ? (
          <p className="text-sm text-ink/50">還沒有投票。<Link href="/app/polls/new" className="text-terracotta hover:underline">起一個</Link>？</p>
        ) : (
          <ul className="divide-y divide-sand">
            {polls
              .slice()
              .sort((a, b) => b.totalVotes - a.totalVotes)
              .slice(0, 8)
              .map((p) => (
                <li key={p.id} className="py-2 flex items-center gap-3">
                  <Link href={`/app/poll/${p.id}`} className="text-sm text-ink hover:text-terracotta flex-1 truncate">
                    {p.question}
                  </Link>
                  <span className="text-xs text-ink/55 tabular-nums">{p.totalVotes} 票 · {p.status === "CLOSED" ? "已結束" : p.closesIn}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {isAdmin && <AdminAnalyticsBlock />}
    </main>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white rounded-soft border border-sand/60 px-4 py-3 shadow-card">
      <div className="text-xs text-ink/55">{label}</div>
      <div className="serif text-2xl text-ink leading-tight">{value}</div>
      <div className="text-[11px] text-ink/40 mt-0.5">{hint}</div>
    </div>
  );
}

async function AdminAnalyticsBlock() {
  const [kpis, byKind, recent, topContrib, byHour] = await Promise.all([
    computeKpisDb(),
    eventsByKindDb(),
    recentEventsDb(20),
    topContributorsDb(30),
    eventsByHourDb(),
  ]);
  const totalEvents = byKind.reduce((s, r) => s + r.count, 0);

  return (
    <section className="mt-8 bg-slate-50 -mx-5 px-5 py-8 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs bg-slate-ink text-white px-2 py-0.5 rounded-full">ADMIN ONLY</span>
          <h2 className="serif text-2xl text-slate-ink">事件儀表板</h2>
          <span className="text-xs text-slate-500">
            來自 <code className="bg-white px-1 rounded">AnalyticsEvent</code> · {totalEvents} 筆事件
          </span>
          <Link href="/app/admin" className="ml-auto text-xs text-slate-700 hover:text-slate-ink underline">
            ⚙️ 前往管理工具 →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="lg:col-span-2 bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-ink">過去 24 小時事件量</h3>
              <span className="text-xs text-slate-500">{byHour.reduce((s, n) => s + n, 0)} 筆</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-1">最活躍成員（過去 30 天）</h3>
            <p className="text-xs text-slate-500 mb-3">依事件總數排名 · 點頭像看個人資料</p>
            {topContrib.length === 0 ? (
              <p className="text-sm text-slate-500">尚無資料</p>
            ) : (
              <div className="space-y-3">
                {topContrib.map((t, i) => {
                  const max = topContrib[0]?.score ?? 1;
                  return (
                    <Link
                      href={`/app/members/${t.member.id}`}
                      key={t.member.id}
                      className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-1 rounded transition"
                    >
                      <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                      <Avatar member={t.member} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-ink truncate">{t.member.name}</div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-slate-ink" style={{ width: `${(t.score / max) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{t.score}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-ink">即時事件流</h3>
              <span className="text-[10px] text-emerald-600 font-medium animate-pulse">● LIVE</span>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">尚無事件——去動態投幾票或發篇文吧</p>
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
      </div>
    </section>
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
