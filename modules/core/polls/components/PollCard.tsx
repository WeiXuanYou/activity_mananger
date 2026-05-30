/**
 * Poll card — used in feed, in activity detail (embedded poll), and
 * in poll list views. Two visual variants:
 *
 *   - `compact={true}`  : small tile for sidebars (no progress bars)
 *   - `compact={false}` : full card with up to 4 option bars
 *
 * The thin gradient ribbon on top is the visual signature of "this is
 * a poll" — quickly recognizable even when scrolling fast.
 *
 * SCHEDULE polls (Doodle-style): the chip says "📅 排程" instead of
 * "📊 投票", option labels are rendered as parsed datetimes, and the
 * top-voted option is highlighted as the "suggested common time".
 */
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import type { Poll } from "../types";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

/** Pretty-print an option label. STANDARD → as-is. SCHEDULE → weekday +
 *  date + time, falling back to the raw label if it isn't parseable. */
function formatOptionLabel(label: string, isSchedule: boolean): string {
  if (!isSchedule) return label;
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${WEEKDAYS[d.getDay()]} ${hh}:${mi}`;
}

/** Pill that conveys urgency. `CLOSING_SOON` pulses for attention. */
function CountdownBadge({ poll }: { poll: Poll }) {
  const tone =
    poll.status === "CLOSED"
      ? "bg-ink/10 text-ink/50"
      : poll.status === "CLOSING_SOON"
      ? "bg-terracotta-soft/60 text-terracotta-dark animate-pulse"
      : "bg-sage-soft/60 text-sage-dark";
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tone}`}>
      {poll.status === "CLOSED" ? "已截止" : `⏰ ${poll.closesIn}`}
    </span>
  );
}

export function PollCard({ poll, compact = false }: { poll: Poll; compact?: boolean }) {
  const author = poll.author ?? findMember(poll.authorId);
  const cats = poll.categories ?? findCategoriesByIds(poll.categoryIds);
  const isSchedule = poll.kind === "SCHEDULE";
  // Top-voted option — for SCHEDULE polls we surface it as "suggested time"
  const topOpt = poll.options.reduce<typeof poll.options[number] | null>(
    (best, o) => (!best || o.votes > best.votes ? o : best),
    null,
  );

  // No outer <Link> here — caller wraps with the right destination. This
  // avoids the historical pre-Phase J bug where the card linked to
  // /mockup/poll regardless of context, AND prevents nested-anchor
  // hydration errors when the caller (e.g. /app/feed) wraps the card in
  // its own real-route <Link>.
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sage to-terracotta opacity-60" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isSchedule
              ? "text-terracotta-dark bg-terracotta-soft/60"
              : "text-sage-dark bg-sage/10"
          }`}>
            {isSchedule ? "📅 排程" : "📊 投票"}
          </span>
          <CountdownBadge poll={poll} />
          {poll.multiSelect && (
            <span className="text-[10px] text-ink/60 bg-cream px-1.5 py-0.5 rounded">多選</span>
          )}
          {poll.anonymous && (
            <span className="text-[10px] text-ink/60 bg-cream px-1.5 py-0.5 rounded">🕶 匿名</span>
          )}
        </div>
      </div>

      <h3 className={`serif text-ink mb-1 ${compact ? "text-base" : "text-lg"}`}>{poll.question}</h3>
      <div className="flex items-center gap-1.5 text-xs text-ink/50 mb-3">
        <Avatar member={author} size={16} />
        <span>{author.name} 發起 · {poll.totalVotes} 票</span>
      </div>

      {!compact && cats.length > 0 && (
        <div className="mb-3"><CategoryChipList categories={cats} size="xs" /></div>
      )}

      {!compact && (
        <div className="space-y-2 mb-3">
          {isSchedule && topOpt && topOpt.votes > 0 && (
            <div className="mb-3 rounded-soft border border-terracotta/30 bg-terracotta-soft/20 px-3 py-2">
              <div className="text-[10px] text-terracotta-dark/70 font-medium tracking-widest">
                目前最多人方便的時段
              </div>
              <div className="text-sm font-medium text-ink mt-0.5">
                {formatOptionLabel(topOpt.label, true)} · {topOpt.votes} 人可以
              </div>
            </div>
          )}
          {poll.options.slice(0, 4).map((opt) => {
            const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            const isTop = isSchedule && topOpt?.id === opt.id && opt.votes > 0;
            return (
              <div key={opt.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={`flex items-center gap-1.5 ${isTop ? "text-ink font-medium" : "text-ink/80"}`}>
                    {isTop && <span>👑</span>}
                    {formatOptionLabel(opt.label, isSchedule)}
                    {opt.addedById && (
                      <span className="text-[10px] text-sage-dark bg-sage/10 px-1 rounded">後加</span>
                    )}
                  </span>
                  <span className="text-ink/50 text-xs">{pct}% · {opt.votes} 票</span>
                </div>
                <div className="h-2 bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-terracotta-soft to-terracotta/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {poll.allowAddOption && (
            <div className="text-xs text-terracotta/80 pt-1">
              ＋ 你也可以新增{isSchedule ? "時段" : "選項"}
            </div>
          )}
        </div>
      )}
      {compact && (
        <div className="text-xs text-terracotta font-medium">點此投票 →</div>
      )}
    </div>
  );
}
