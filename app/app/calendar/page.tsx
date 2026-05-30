import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { listActivitiesDb } from "@/modules/core/activities";
import type { Activity } from "@/modules/core/activities";

/**
 * Month-grid calendar of activities. Server component — reads DB and
 * builds a 6-row × 7-col grid for the requested month.
 *
 * URL: /app/calendar?month=YYYY-MM (defaults to the current month).
 */
type Search = { searchParams: Promise<{ month?: string }> };

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function parseMonth(s?: string): { year: number; month: number } {
  const now = new Date();
  if (s) {
    const m = s.match(/^(\d{4})-(\d{2})$/);
    if (m) return { year: +m[1], month: +m[2] - 1 }; // 0-indexed for Date
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function fmtMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function AppCalendarPage({ searchParams }: Search) {
  await requireCurrentUser();
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);

  // Bucket activities by YYYY-MM-DD for instant lookup
  const allActivities = await listActivitiesDb();
  const byDay = new Map<string, Activity[]>();
  for (const a of allActivities) {
    // a.startsAt is "YYYY-MM-DD HH:mm" — take the date part
    const key = a.startsAt.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(a);
  }

  // Build the 6-week grid. Start on Sunday of the week containing the first.
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sun
  const gridStart = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const prevMonth = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const nextMonth = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthCount = allActivities.filter(
    (a) => a.startsAt.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  ).length;

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-end gap-4 mb-4 sm:mb-6 flex-wrap">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CALENDAR</p>
          <h1 className="serif text-2xl sm:text-3xl text-ink">{year} 年 {month + 1} 月</h1>
          <p className="text-ink/60 text-sm mt-1">本月有 <strong className="text-ink/80">{monthCount}</strong> 場活動</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/app/calendar?month=${fmtMonth(prevMonth.y, prevMonth.m)}`}
            className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40"
          >
            ← 上月
          </Link>
          <Link
            href="/app/calendar"
            className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40"
          >
            今天
          </Link>
          <Link
            href={`/app/calendar?month=${fmtMonth(nextMonth.y, nextMonth.m)}`}
            className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40"
          >
            下月 →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-sand bg-cream/40">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 || i === 6 ? "text-terracotta-dark" : "text-ink/60"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = d.toISOString().slice(0, 10);
            const inMonth = d.getMonth() === month;
            const isToday = key === todayKey;
            const events = byDay.get(key) ?? [];
            return (
              <div
                key={i}
                className={`min-h-[56px] sm:min-h-[88px] border-b border-r border-sand last-of-type:border-r-0 p-1 sm:p-1.5 ${
                  inMonth ? "bg-white" : "bg-cream/30"
                } ${isToday ? "ring-2 ring-terracotta ring-inset" : ""}`}
              >
                <div
                  className={`text-[10px] sm:text-xs mb-1 ${
                    inMonth ? "text-ink/70" : "text-ink/30"
                  } ${isToday ? "font-bold text-terracotta" : ""}`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {/* Mobile shows only a dot per event (saves space); md+ shows full title */}
                  <div className="sm:hidden flex flex-wrap gap-0.5">
                    {events.slice(0, 4).map((a) => (
                      <Link
                        key={a.id}
                        href={`/app/activity/${a.id}`}
                        title={a.title}
                        className="w-1.5 h-1.5 rounded-full bg-terracotta"
                      />
                    ))}
                  </div>
                  <div className="hidden sm:block space-y-0.5">
                    {events.slice(0, 3).map((a) => (
                      <Link
                        key={a.id}
                        href={`/app/activity/${a.id}`}
                        className="block text-[10px] leading-tight px-1.5 py-0.5 rounded bg-terracotta-soft/60 text-terracotta-dark hover:bg-terracotta hover:text-white transition truncate"
                        title={a.title}
                      >
                        {a.startsAt.slice(11, 16)} {a.title}
                      </Link>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-ink/40">+{events.length - 3}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        點任一活動方塊跳到活動詳情；橘框是今天。每天最多顯示 3 個活動，超過會顯示 +N。
      </div>
    </main>
  );
}
