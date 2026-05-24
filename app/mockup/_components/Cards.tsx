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
    <article className="bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition">
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
      <div className="flex items-center gap-4 text-sm text-ink/60 pt-3 border-t border-sand">
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

export function PollCard({ poll, compact = false }: { poll: Poll; compact?: boolean }) {
  return (
    <Link
      href="/mockup/poll"
      className="block bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full">📊 投票</span>
        <span className="text-xs text-ink/50">{poll.totalVotes} 票 · 截止 {poll.closesAt}</span>
      </div>
      <h3 className={`serif text-ink mb-3 ${compact ? "text-base" : "text-lg"}`}>{poll.question}</h3>
      {!compact && (
        <div className="space-y-2">
          {poll.options.map((opt) => {
            const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            return (
              <div key={opt.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink/80">{opt.label}</span>
                  <span className="text-ink/50 text-xs">{pct}% · {opt.votes} 票</span>
                </div>
                <div className="h-2 bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta-soft"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {compact && (
        <div className="text-xs text-terracotta font-medium">點此投票 →</div>
      )}
    </Link>
  );
}
