/**
 * Date helpers for human-friendly formatting in Chinese.
 *
 * **Important design choice — a fixed reference date.**
 * `REFERENCE` is locked to 2026-05-25 because all the seed activities
 * are dated relative to it. Without this, "下次相聚" countdowns would
 * drift as wall-clock time advanced past 2026, breaking the demo.
 *
 * Phase C+ TODO: when activities come from the DB with real-time
 * `startsAt`, replace `REFERENCE` with `new Date()` and let the
 * helpers operate on actual wall-clock time.
 */

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * Parse our mock-format date string into a Date.
 * Accepts `"YYYY-MM-DD"` and `"YYYY-MM-DD HH:mm"`; anything else
 * falls back to `new Date(input)` (covers ISO strings from Prisma).
 *
 * Local time is intentional — these are calendar dates ("外婆生日 6/15"),
 * not absolute instants, so UTC would only confuse users.
 */
function parse(input: string): Date {
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

/** The mock "today". See file header for why this is hard-coded. */
const REFERENCE = new Date(2026, 4, 25);

/**
 * Whole days from REFERENCE to the given date.
 * Positive = future, negative = past, 0 = same day.
 * UTC math avoids DST cliff issues.
 */
export function daysFromNow(input: string): number {
  const d = parse(input);
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(REFERENCE.getFullYear(), REFERENCE.getMonth(), REFERENCE.getDate());
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/** `"今天"` / `"明天"` / `"昨天"` / `"09/25 (五)"` */
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

/** `"9 月 25 日 · 五 · 18:00"` — for activity detail headers. */
export function formatLongDate(input: string): string {
  const d = parse(input);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} 月 ${day} 日 · ${WEEKDAYS[d.getDay()]} · ${hh}:${mm}`;
}

/** `"還有 3 天"` / `"今天"` / `"明天"` / `"昨天"` / `"已過 2 天"` */
export function relativeFromNow(input: string): string {
  const diff = daysFromNow(input);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff > 0) return `還有 ${diff} 天`;
  if (diff === -1) return "昨天";
  return `已過 ${Math.abs(diff)} 天`;
}
