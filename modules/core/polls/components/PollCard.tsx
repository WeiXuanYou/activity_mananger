/**
 * Poll card — used in feed, in activity detail (embedded poll), and
 * in poll list views. Two visual variants:
 *
 *   - `compact={true}`  : small tile for sidebars (no progress bars)
 *   - `compact={false}` : full card with up to 4 option bars
 *
 * The thin gradient ribbon on top is the visual signature of "this is
 * a poll" — quickly recognizable even when scrolling fast.
 */
import Link from "next/link";
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import type { Poll } from "../types";

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
  const author = findMember(poll.authorId);
  const cats = findCategoriesByIds(poll.categoryIds);

  return (
    <Link
      href="/mockup/poll"
      className="block bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sage to-terracotta opacity-60" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full font-medium">
            📊 投票
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
          {poll.options.slice(0, 4).map((opt) => {
            const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            return (
              <div key={opt.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink/80 flex items-center gap-1.5">
                    {opt.label}
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
            <div className="text-xs text-terracotta/80 pt-1">＋ 你也可以新增選項</div>
          )}
        </div>
      )}
      {compact && (
        <div className="text-xs text-terracotta font-medium">點此投票 →</div>
      )}
    </Link>
  );
}
