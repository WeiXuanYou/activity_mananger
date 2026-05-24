import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { ActivityCard, PostCard, PollCard } from "../_components/Cards";
import { activities, posts, polls, members } from "../_data";
import { Avatar } from "../_components/Avatar";

export default function FeedMockup() {
  return (
    <main>
      <MockNav active="/mockup/feed" />
      <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left rail */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
            <h3 className="serif text-base text-ink mb-3">即將到來</h3>
            <div className="space-y-3">
              {activities.slice(0, 2).map((a) => (
                <Link key={a.id} href="/mockup/activity" className="block group">
                  <div className="text-xs text-terracotta font-medium mb-0.5">
                    {a.startsAt.slice(0, 10)}
                  </div>
                  <div className="text-sm text-ink group-hover:text-terracotta">{a.title}</div>
                  <div className="text-xs text-ink/50">{a.location}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
            <h3 className="serif text-base text-ink mb-3">家人</h3>
            <div className="space-y-2">
              {members.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href="/mockup/profile"
                  className="flex items-center gap-2 hover:bg-cream/40 -mx-2 px-2 py-1 rounded-soft transition"
                >
                  <Avatar member={m} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{m.name}</div>
                  </div>
                  <span className="text-[10px] text-ink/40">{m.role}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main feed */}
        <section className="lg:col-span-6 space-y-5">
          <Link
            href="/mockup/create"
            className="block bg-white rounded-soft shadow-card border border-sand/60 p-4 hover:shadow-soft transition"
          >
            <div className="flex items-center gap-3">
              <Avatar member={members[1]} size={40} />
              <div className="flex-1 bg-cream/50 rounded-soft px-4 py-2.5 text-ink/50 text-sm">
                寫點什麼分享給家人...
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sand text-xs">
              <span className="px-3 py-1 rounded-full bg-terracotta-soft/40 text-terracotta-dark">📝 文章</span>
              <span className="px-3 py-1 rounded-full bg-sage-soft/40 text-sage-dark">🍖 活動</span>
              <span className="px-3 py-1 rounded-full bg-sand/60 text-ink/70">📊 投票</span>
              <span className="px-3 py-1 rounded-full bg-cream text-ink/70">⭐ 推薦</span>
            </div>
          </Link>

          <ActivityCard activity={activities[0]} />
          <PostCard post={posts[0]} />
          <PollCard poll={polls[0]} />
          <PostCard post={posts[1]} />
          <ActivityCard activity={activities[1]} />
          <PostCard post={posts[2]} />
        </section>

        {/* Right rail */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
            <h3 className="serif text-base text-ink mb-3">熱門投票</h3>
            <div className="space-y-3">
              {polls.map((p) => (
                <PollCard key={p.id} poll={p} compact />
              ))}
            </div>
          </div>

          <div className="bg-sage-soft/40 rounded-soft border border-sage/30 p-4">
            <div className="text-xs text-sage-dark font-medium mb-2">💡 提示</div>
            <p className="text-sm text-ink/70 leading-relaxed">
              想要更多權限（建立活動、發起投票）？
              <Link href="/mockup/permissions" className="text-terracotta hover:underline ml-1">
                提出申請
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
