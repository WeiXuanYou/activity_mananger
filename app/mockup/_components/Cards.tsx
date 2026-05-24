import Link from "next/link";
import { Activity, Post, Poll, findMember } from "../_data";
import { Avatar } from "./Avatar";

export function ActivityCard({ activity }: { activity: Activity }) {
  const host = findMember(activity.hostId);
  return (
    <Link
      href="/mockup/activity"
      className="block bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 hover:shadow-soft transition group"
    >
      <div className="h-32 relative" style={{ background: activity.cover }}>
        <span className="absolute top-3 left-3 bg-white/90 text-terracotta text-xs font-medium px-2 py-1 rounded-full">
          活動
        </span>
        <span className="absolute bottom-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
          {activity.startsAt.slice(5, 10).replace("-", "/")}
        </span>
      </div>
      <div className="p-4">
        <h3 className="serif text-lg text-ink mb-1 group-hover:text-terracotta transition">
          {activity.title}
        </h3>
        <p className="text-ink/60 text-sm mb-3">📍 {activity.location}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink/60">
            <Avatar member={host} size={20} />
            <span>{host.name} 發起</span>
          </div>
          <div className="text-xs text-sage-dark font-medium">
            {activity.rsvp.going} 人參加
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  const author = findMember(post.authorId);
  const kindLabel = { ARTICLE: "📝 文章", RECOMMENDATION: "⭐ 推薦", NOTE: "💭 隨筆" }[post.kind];
  return (
    <article
      className={`rounded-soft border p-5 hover:shadow-soft transition ${
        post.isPinned
          ? "bg-gradient-to-br from-terracotta-soft/30 to-cream shadow-soft border-terracotta/30"
          : "bg-white shadow-card border-sand/60"
      }`}
    >
      {post.isPinned && (
        <div className="flex items-center gap-2 mb-3 text-xs text-terracotta-dark font-medium">
          <span>📌 由管理員置頂</span>
          <span className="text-ink/40">·</span>
          <span className="text-ink/50">所有家人都會看到</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <Avatar member={author} size={36} />
        <div>
          <div className="text-sm font-medium text-ink">{author.name}</div>
          <div className="text-xs text-ink/50">{post.createdAt}</div>
        </div>
        <span className="ml-auto text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full">
          {kindLabel}
        </span>
      </div>
      {post.title && (
        <h3 className="serif text-xl text-ink mb-2">{post.title}</h3>
      )}
      <p className="text-ink/75 leading-relaxed mb-4">{post.body}</p>
      <div className="flex items-center gap-4 text-sm text-ink/60 pt-3 border-t border-sand/70">
        <button className="flex items-center gap-1.5 hover:text-terracotta transition">
          ❤️ <span>{post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-terracotta transition">
          💬 <span>{post.comments}</span>
        </button>
        <button className="ml-auto text-xs hover:text-terracotta">分享</button>
      </div>
    </article>
  );
}

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
  return (
    <Link
      href="/mockup/poll"
      className="block bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition relative overflow-hidden"
    >
      {/* Line-style ribbon */}
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
            <div className="text-xs text-terracotta/80 pt-1">
              ＋ 你也可以新增選項
            </div>
          )}
        </div>
      )}
      {compact && (
        <div className="text-xs text-terracotta font-medium">點此投票 →</div>
      )}
    </Link>
  );
}
