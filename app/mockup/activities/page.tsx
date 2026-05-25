import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import {
  listUpcomingActivities,
  listPastActivities,
  findNextActivity,
  ActivityCard,
} from "@/modules/core/activities";
import type { Activity } from "@/modules/core/activities";
import {
  CategoryFilterBar,
  findCategoryBySlug,
  listCategories,
} from "@/modules/core/categories";
import { formatLongDate, relativeFromNow } from "@/lib/date";
import { Avatar, findMember } from "@/modules/core/members";

type Search = { searchParams: Promise<{ cat?: string; tab?: string }> };

export default async function ActivitiesListMockup({ searchParams }: Search) {
  const { cat: categorySlug, tab = "upcoming" } = await searchParams;
  const activeCategory = categorySlug ? findCategoryBySlug(categorySlug) : undefined;
  const categories = listCategories();
  const next = findNextActivity();

  const filterBySlug = (xs: Activity[]) =>
    activeCategory ? xs.filter((a) => a.categoryIds.includes(activeCategory.id)) : xs;

  const upcoming = filterBySlug(listUpcomingActivities());
  const past = filterBySlug(listPastActivities());
  const list = tab === "past" ? past : upcoming;

  return (
    <main>
      <MockNav active="/mockup/activities" />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ACTIVITIES</p>
          <h1 className="serif text-3xl text-ink">活動</h1>
          <p className="text-ink/60 text-sm mt-1">家人和朋友最近與接下來的所有相聚</p>
        </div>

        {next && tab !== "past" && (
          <NextActivityHero activity={next} />
        )}

        <div className="flex items-center gap-1 mb-4 mt-6 border-b border-sand">
          {([
            ["upcoming", `即將到來 (${upcoming.length})`],
            ["past", `已過去 (${past.length})`],
          ] as const).map(([key, label]) => {
            const isActive = tab === key;
            const href = `/mockup/activities?tab=${key}${categorySlug ? `&cat=${categorySlug}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? "border-terracotta text-terracotta"
                    : "border-transparent text-ink/60 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="mb-6">
          <CategoryFilterBar
            categories={categories}
            activeSlug={categorySlug}
            basePath={`/mockup/activities?tab=${tab}&`.replace("?tab=upcoming&", "")}
          />
        </div>

        {list.length === 0 ? (
          <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-12 text-center">
            <div className="text-4xl mb-2">🌿</div>
            <p className="serif text-lg text-ink/70 mb-1">
              {tab === "past" ? "這個分類還沒有過去的活動" : "這個分類還沒有活動"}
            </p>
            <Link href="/mockup/create" className="text-sm text-terracotta hover:underline">
              建立第一個活動 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function NextActivityHero({ activity }: { activity: Activity }) {
  const host = findMember(activity.hostId);
  return (
    <div className="bg-white rounded-soft shadow-soft overflow-hidden border border-sand/60">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-2 h-32 md:h-auto" style={{ background: activity.cover }} />
        <div className="md:col-span-3 p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-widest text-sage-dark font-medium">NEXT GATHERING</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-terracotta-soft text-terracotta-dark font-medium animate-pulse">
              {relativeFromNow(activity.startsAt)}
            </span>
          </div>
          <Link href="/mockup/activity">
            <h2 className="serif text-2xl text-ink hover:text-terracotta transition mb-2">{activity.title}</h2>
          </Link>
          <div className="text-sm text-ink/70 mb-1">📅 {formatLongDate(activity.startsAt)}</div>
          <div className="text-sm text-ink/70 mb-4">📍 {activity.location}</div>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-sand">
            <div className="flex items-center gap-2 text-sm text-ink/65">
              <Avatar member={host} size={24} />
              <span>{host.name} 發起 · {activity.rsvp.going} 人參加</span>
            </div>
            <Link
              href="/mockup/activity"
              className="text-sm px-3 py-1.5 rounded-soft bg-terracotta text-white font-medium hover:bg-terracotta-dark"
            >
              查看詳情 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
