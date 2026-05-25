import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import { Avatar, getMockCurrentUser, listMembers } from "@/modules/core/members";
import {
  CategoryFilterBar,
  CategoryChip,
  findCategoryBySlug,
  listCategories,
} from "@/modules/core/categories";
import {
  buildFeed,
  FeedHero,
  FeedItem,
  PinnedSection,
} from "@/modules/core/feed";
import {
  listActivities,
  listUpcomingActivities,
  findNextActivity,
} from "@/modules/core/activities";
import type { Activity } from "@/modules/core/activities";
import { listPolls, PollCard } from "@/modules/core/polls";
import { formatShortDate, relativeFromNow } from "@/lib/date";

type Search = { searchParams: Promise<{ cat?: string }> };

export default async function FeedMockup({ searchParams }: Search) {
  const { cat: categorySlug } = await searchParams;
  const activeCategory = categorySlug ? findCategoryBySlug(categorySlug) : undefined;

  const me = getMockCurrentUser();
  const members = listMembers();
  const categories = listCategories();
  const feedItems = buildFeed({ categorySlug });
  const polls = listPolls();
  const nextActivity = findNextActivity();

  return (
    <main>
      <MockNav active="/mockup/feed" />
      <FeedHero member={me} newThisVisit={3} />

      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="serif text-sm text-ink/70 font-medium">🏷 依分類瀏覽</h2>
            <Link href="#" className="text-xs text-ink/50 hover:text-terracotta">管理分類 →</Link>
          </div>
          <CategoryFilterBar
            categories={categories}
            activeSlug={categorySlug}
            basePath="/mockup/feed"
          />
        </div>

        {/* Mobile-only NEXT GATHERING above the fold */}
        {nextActivity && (
          <div className="lg:hidden mb-5">
            <NextGatheringCountdown activity={nextActivity} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="hidden lg:block lg:col-span-3 space-y-5 order-2 lg:order-1">
            {nextActivity && <NextGatheringCountdown activity={nextActivity} />}
            <UpcomingActivitiesCard />
            <MembersCard members={members} />
            <QuoteCard />
          </aside>

          <section className="lg:col-span-6 space-y-5 order-1 lg:order-2">
            <ComposerCard meName={me.name} meAvatar={me} />

            {!activeCategory && <PinnedSection />}

            <div className="flex items-center gap-2 text-xs text-ink/40 px-1 pt-2">
              <span>{activeCategory ? `「${activeCategory.name}」分類` : "最新動態"}</span>
              <div className="flex-1 divider-dashed" />
              <span>{feedItems.length} 則</span>
            </div>

            {feedItems.length === 0 && <EmptyFilterState />}

            {feedItems.map((item) => (
              <FeedItem key={`${item.kind}-${item.data.id}`} item={item} />
            ))}
          </section>

          <aside className="lg:col-span-3 space-y-5 order-3">
            <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
              <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
                <span>📊</span> 進行中投票
              </h3>
              <div className="space-y-3">
                {polls.map((p) => <PollCard key={p.id} poll={p} compact />)}
              </div>
            </div>

            <PermissionTip />
            <BirthdayCard />
            {/* Mobile-only — sidebar cards from the left rail */}
            <div className="lg:hidden space-y-5">
              <UpcomingActivitiesCard />
              <MembersCard members={members} />
              <QuoteCard />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ---- Composable pieces ---- */

function NextGatheringCountdown({ activity }: { activity: Activity }) {
  return (
    <Link
      href="/mockup/activity"
      className="block bg-gradient-to-br from-terracotta to-terracotta-dark text-white rounded-soft shadow-soft p-4 hover:shadow-lg transition"
    >
      <div className="text-[10px] tracking-widest opacity-80 mb-1">⏳ 下次相聚</div>
      <div className="serif text-lg leading-snug">{activity.title}</div>
      <div className="text-xs opacity-80 mt-1">{formatShortDate(activity.startsAt)} · {activity.location}</div>
      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
        <span className="text-xs opacity-80">距離</span>
        <span className="font-semibold text-white">{relativeFromNow(activity.startsAt)}</span>
      </div>
    </Link>
  );
}

function EmptyFilterState() {
  return (
    <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
      <div className="text-4xl mb-2">🌿</div>
      <p className="serif text-lg text-ink/70 mb-1">這個分類還沒有內容</p>
      <p className="text-sm text-ink/50 mb-4">換一個分類，或<Link href="/mockup/create" className="text-terracotta hover:underline">建立第一篇</Link></p>
      <Link href="/mockup/feed" className="inline-block text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/60">
        ← 看全部動態
      </Link>
    </div>
  );
}

function ComposerCard({ meName, meAvatar }: { meName: string; meAvatar: Parameters<typeof Avatar>[0]["member"] }) {
  return (
    <Link
      href="/mockup/create"
      className="block bg-white rounded-soft shadow-card border border-sand/60 p-4 hover:shadow-soft transition"
    >
      <div className="flex items-center gap-3">
        <Avatar member={meAvatar} size={40} />
        <div className="flex-1 bg-cream/50 rounded-soft px-4 py-2.5 text-ink/50 text-sm">
          {meName}，分享點什麼...
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sand text-xs">
        <span className="px-3 py-1 rounded-full bg-terracotta-soft/40 text-terracotta-dark">📝 文章</span>
        <span className="px-3 py-1 rounded-full bg-sage-soft/40 text-sage-dark">🍖 活動</span>
        <span className="px-3 py-1 rounded-full bg-sand/60 text-ink/70">📊 投票</span>
        <span className="px-3 py-1 rounded-full bg-cream text-ink/70">⭐ 推薦</span>
      </div>
    </Link>
  );
}

function UpcomingActivitiesCard() {
  const activities = listUpcomingActivities().slice(0, 3);
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="serif text-base text-ink flex items-center gap-2">
          <span>🗓</span> 即將到來
        </h3>
        <Link href="/mockup/activities" className="text-xs text-ink/50 hover:text-terracotta">全部 →</Link>
      </div>
      <div className="space-y-3">
        {activities.map((a) => (
          <Link key={a.id} href="/mockup/activity" className="block group">
            <div className="text-xs text-terracotta font-medium mb-0.5">{formatShortDate(a.startsAt)}</div>
            <div className="text-sm text-ink group-hover:text-terracotta">{a.title}</div>
            <div className="text-xs text-ink/50">{a.location}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MembersCard({ members }: { members: ReturnType<typeof listMembers> }) {
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
      <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
        <span>👫</span> 家人與朋友
      </h3>
      <div className="space-y-2">
        {members.slice(0, 6).map((m, i) => (
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
  );
}

function QuoteCard() {
  return (
    <div className="bg-terracotta-soft/30 rounded-soft border border-terracotta/20 p-4">
      <div className="text-xs text-terracotta-dark font-medium mb-1">💛 今日心意</div>
      <p className="text-sm text-ink/75 leading-relaxed italic">
        「家不是地方，是有彼此的時光。朋友也是。」
      </p>
    </div>
  );
}

function PermissionTip() {
  return (
    <div className="bg-sage-soft/40 rounded-soft border border-sage/30 p-4">
      <div className="text-xs text-sage-dark font-medium mb-2">💡 提示</div>
      <p className="text-sm text-ink/70 leading-relaxed">
        想要更多權限（建立活動、發起投票、置頂文章）？
        <Link href="/mockup/permissions" className="text-terracotta hover:underline ml-1">
          提出申請
        </Link>
      </p>
    </div>
  );
}

function BirthdayCard() {
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 text-center">
      <div className="text-2xl mb-1">🎂</div>
      <div className="text-xs text-ink/50 mb-1">本月生日</div>
      <div className="serif text-base text-ink">爸爸 · 5/28</div>
      <div className="text-xs text-ink/50 mt-0.5">還有 3 天</div>
    </div>
  );
}
