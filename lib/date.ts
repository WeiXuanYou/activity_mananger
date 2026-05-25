/**
 * Pure date helpers. Phase A uses string-based mock dates so these are
 * lightweight. Phase B+ will swap to Date / Temporal as needed.
 */

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** "2026-09-25 18:00" → { date: Date, weekday: '五', isToday, isTomorrow, daysAway } */
function parse(input: string): Date {
  // Treat "YYYY-MM-DD HH:mm" as local time
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return new Date(input);
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    m[4] ? Number(m[4]) : 0,
    m[5] ? Number(m[5]) : 0,
  );
}

const REFERENCE = new Date(2026, 4, 25); // 2026-05-25, matches our mock "今天"

export function daysFromNow(input: string): number {
  const d = parse(input);
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(REFERENCE.getFullYear(), REFERENCE.getMonth(), REFERENCE.getDate());
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/** "09/25 (五)" or "今天" / "明天" */
export function formatShortDate(input: string): string {
  const d = parse(input);
  const diff = daysFromNow(input);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd} (${WEEKDAYS[d.getDay()]})`;
}

/** "9 月 25 日 · 五 · 18:00" */
export function formatLongDate(input: string): string {
  const d = parse(input);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} 月 ${day} 日 · ${WEEKDAYS[d.getDay()]} · ${hh}:${mm}`;
}

/** "還有 3 天" / "今天" / "已過 2 天" */
export function relativeFromNow(input: string): string {
  const diff = daysFromNow(input);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff > 0) return `還有 ${diff} 天`;
  if (diff === -1) return "昨天";
  return `已過 ${Math.abs(diff)} 天`;
}
