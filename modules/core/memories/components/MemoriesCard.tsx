import Link from "next/link";
import type { Memory } from "../db";

const KIND_EMOJI: Record<Memory["kind"], string> = {
  post: "📝",
  activity: "🍖",
};

/**
 * "On this day" widget. Renders only if there's at least one memory —
 * a quiet section is better than an empty teaser. Caller decides where
 * to place it; on the feed it sits in the right rail above polls.
 */
export function MemoriesCard({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) return null;
  const currentYear = new Date().getFullYear();

  return (
    <section className="bg-gradient-to-br from-cream to-terracotta-soft/30 rounded-soft shadow-card border border-terracotta/20 p-5">
      <h3 className="serif text-lg text-ink mb-1 flex items-center gap-2">
        📅 去年的今天
      </h3>
      <p className="text-xs text-ink/55 mb-3">同一天，去年和更早的相聚回顧</p>

      <div className="space-y-3">
        {memories.map((m) => {
          const diff = currentYear - m.year;
          const yearLabel = diff === 1 ? "去年" : `${diff} 年前`;
          return (
            <Link
              key={`${m.kind}-${m.id}`}
              href={m.href}
              className="block rounded-soft bg-white/70 border border-sand/60 px-3 py-2.5 hover:bg-white hover:shadow-card transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-terracotta-soft/60 text-terracotta-dark font-medium">
                  {yearLabel} · {m.year}
                </span>
                <span className="text-xs">{KIND_EMOJI[m.kind]}</span>
              </div>
              <div className="text-sm font-medium text-ink leading-snug">{m.title}</div>
              <div className="text-xs text-ink/55 mt-0.5 line-clamp-2">{m.snippet}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
