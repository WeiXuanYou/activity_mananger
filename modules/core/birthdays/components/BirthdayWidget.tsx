import Link from "next/link";
import type { UpcomingBirthday } from "../types";

/**
 * Compact "upcoming birthdays" rail. Renders nothing if the list is empty
 * so the feed doesn't look cluttered when there's no birthday this month.
 *
 * Color palette is the same warm gradient as the memories widget on
 * purpose — both are "soft" surfaces sitting above the colder upcoming/
 * polls cards.
 */
export function BirthdayWidget({ birthdays }: { birthdays: UpcomingBirthday[] }) {
  if (birthdays.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-terracotta-soft/40 to-cream rounded-soft shadow-card border border-terracotta/20 p-5">
      <h3 className="serif text-lg text-ink mb-1 flex items-center gap-2">
        🎂 即將到來的生日
      </h3>
      <p className="text-xs text-ink/55 mb-3">未來 14 天內的家人生日</p>

      <div className="space-y-2">
        {birthdays.map((b) => {
          const label =
            b.daysAway === 0 ? "今天！" :
            b.daysAway === 1 ? "明天" :
            `${b.daysAway} 天後`;
          return (
            <Link
              key={b.userId}
              href={`/app/members/${b.userId}`}
              className="flex items-center gap-3 rounded-soft bg-white/70 border border-sand/60 px-3 py-2 hover:bg-white hover:shadow-card transition"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                style={{ background: b.avatarColor }}
              >
                {b.initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">{b.name}</div>
                <div className="text-[10px] text-ink/50">{b.dateLabel} · 即將 {b.turningAge} 歲</div>
              </div>
              <span className={`text-xs font-medium tabular-nums whitespace-nowrap px-2 py-0.5 rounded-full ${
                b.daysAway === 0
                  ? "bg-terracotta text-white"
                  : b.daysAway <= 3
                  ? "bg-terracotta-soft/70 text-terracotta-dark"
                  : "bg-cream text-ink/60"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
