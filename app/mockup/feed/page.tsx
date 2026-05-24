import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { ActivityCard, PostCard, PollCard } from "../_components/Cards";
import { activities, posts, polls, members } from "../_data";
import { Avatar } from "../_components/Avatar";

export default function FeedMockup() {
  const me = members.find((m) => m.id === "u2")!;
  const pinned = posts.filter((p) => p.isPinned);
  const regular = posts.filter((p) => !p.isPinned);

  return (
    <main>
      <MockNav active="/mockup/feed" />

      {/* Warm greeting hero */}
      <section className="bg-gradient-to-br from-terracotta-soft/40 via-cream to-sage-soft/30 border-b border-sand/60">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center gap-4">
          <div className="text-4xl">🌿</div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="serif text-2xl text-ink">
              {greetingByHour()}，{me.name}
            </h1>
            <p className="text-sm text-ink/65 mt-0.5">
              家裡今天有 <strong className="text-terracotta-dark">3</strong> 件新事——一場烤肉、一個投票、一篇外婆的食譜。
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur px-3 py-2 rounded-full text-xs text-ink/70">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="font-medium">5 人現在在線</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left rail */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
            <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
              <span>🗓</span> 即將到來
            </h3>
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
            <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> 家人
            </h3>
            <div className="space-y-2">
              {members.slice(0, 5).map((m, i) => (
                <Link
                  key={m.id}
                  href="/mockup/profile"
                  className="flex items-center gap-2 hover:bg-cream/40 -mx-2 px-2 py-1 rounded-soft transition"
                >
                  <div className="relative">
                    <Avatar member={m} size={28} />
                    {i < 3 && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-sage ring-2 ring-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink truncate">{m.name}</div>
                  </div>
                  <span className="text-[10px] text-ink/40">{m.role}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-terracotta-soft/30 rounded-soft border border-terracotta/20 p-4">
            <div className="text-xs text-terracotta-dark font-medium mb-1">💛 今日心意</div>
            <p className="text-sm text-ink/75 leading-relaxed italic">
              「家不是地方，是有彼此的時光。」
            </p>
          </div>
        </aside>

        {/* Main feed */}
        <section className="lg:col-span-6 space-y-5">
          <Link
            href="/mockup/create"
            className="block bg-white rounded-soft shadow-card border border-sand/60 p-4 hover:shadow-soft transition"
          >
            <div className="flex items-center gap-3">
              <Avatar member={me} size={40} />
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

          {/* Pinned section */}
          {pinned.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-terracotta-dark font-medium px-1">
                <span>📌 置頂</span>
                <div className="flex-1 divider-dashed" />
              </div>
              {pinned.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-ink/40 px-1 pt-2">
            <span>最新動態</span>
            <div className="flex-1 divider-dashed" />
          </div>

          <ActivityCard activity={activities[0]} />
          <PostCard post={regular[0]} />
          <PollCard poll={polls[0]} />
          <PostCard post={regular[1]} />
          <ActivityCard activity={activities[1]} />
          <PollCard poll={polls[2]} />
          <PostCard post={regular[2]} />
        </section>

        {/* Right rail */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
            <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
              <span>📊</span> 進行中投票
            </h3>
            <div className="space-y-3">
              {polls.map((p) => (
                <PollCard key={p.id} poll={p} compact />
              ))}
            </div>
          </div>

          <div className="bg-sage-soft/40 rounded-soft border border-sage/30 p-4">
            <div className="text-xs text-sage-dark font-medium mb-2">💡 提示</div>
            <p className="text-sm text-ink/70 leading-relaxed">
              想要更多權限（建立活動、發起投票、置頂文章）？
              <Link href="/mockup/permissions" className="text-terracotta hover:underline ml-1">
                提出申請
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 text-center">
            <div className="text-2xl mb-1">🎂</div>
            <div className="text-xs text-ink/50 mb-1">本月生日</div>
            <div className="serif text-base text-ink">爸爸 · 5/28</div>
            <div className="text-xs text-ink/50 mt-0.5">還有 4 天</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function greetingByHour() {
  // Static for SSR / deterministic snapshot
  return "午安";
}
