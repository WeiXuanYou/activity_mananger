import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listUpcomingActivitiesDb,
  listPastActivitiesDb,
  findNextActivityDb,
  ActivityCard,
} from "@/modules/core/activities";
import { findCategoryBySlugDb, listCategoriesDb, CategoryFilterBar } from "@/modules/core/categories";
import { findMemberDb, Avatar } from "@/modules/core/members";
import { formatLongDate, relativeFromNow } from "@/lib/date";

type Search = { searchParams: Promise<{ tab?: string; cat?: string }> };

export default async function AppActivitiesPage({ searchParams }: Search) {
  const { tab = "upcoming", cat: slug } = await searchParams;
  await requireCurrentUser();

  const [upcoming, past, categories, activeCategory, next, canCreateCategory] =
    await Promise.all([
      listUpcomingActivitiesDb(),
      listPastActivitiesDb(),
      listCategoriesDb(),
      slug ? findCategoryBySlugDb(slug) : null,
      findNextActivityDb(),
      canCurrentUser("category.create"),
    ]);

  const filterByCat = <T extends { categoryIds: string[] }>(xs: T[]) =>
    activeCategory ? xs.filter((x) => x.categoryIds.includes(activeCategory.id)) : xs;

  const visibleUpcoming = filterByCat(upcoming);
  const visiblePast = filterByCat(past);
  const list = tab === "past" ? visiblePast : visibleUpcoming;

  return (
    <main className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ACTIVITIES</p>
          <h1 className="serif text-3xl text-ink">活動</h1>
        </div>
        <Link
          href="/app/activities/new"
          className="ml-auto px-4 py-2 rounded-soft bg-terracotta text-white font-medium text-sm shadow-card hover:bg-terracotta-dark transition"
        >
          + 建立活動
        </Link>
      </div>

      {next && tab !== "past" && <NextActivityHero activity={next} />}

      <div className="flex items-center gap-1 mb-4 mt-6 border-b border-sand">
        {([
          ["upcoming", `即將到來 (${visibleUpcoming.length})`],
          ["past", `已過去 (${visiblePast.length})`],
        ] as const).map(([key, label]) => {
          const isActive = tab === key;
          const href = `/app/activities?tab=${key}${slug ? `&cat=${slug}` : ""}`;
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
          activeSlug={slug}
          basePath={`/app/activities?tab=${tab}&`.replace("?tab=upcoming&", "")}
          canCreate={canCreateCategory}
        />
      </div>

      {list.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-4xl mb-2">{tab === "past" ? "🌿" : "🍖"}</div>
          <p className="serif text-lg text-ink/70 mb-3">
            {tab === "past" ? "沒有過去的活動" : "還沒有排定的活動"}
          </p>
          {tab !== "past" && (
            <Link
              href="/app/activities/new"
              className="inline-block text-sm px-4 py-2 rounded-soft bg-terracotta text-white hover:bg-terracotta-dark"
            >
              + 辦一場活動
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((a) => (
            <Link key={a.id} href={`/app/activity/${a.id}`}>
              <ActivityCard activity={a} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

async function NextActivityHero({ activity }: { activity: Awaited<ReturnType<typeof findNextActivityDb>> }) {
  if (!activity) return null;
  const host = await findMemberDb(activity.hostId);
  return (
    <div className="bg-white rounded-soft shadow-soft overflow-hidden border border-sand/60">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-2 h-32 md:h-auto" style={{ background: activity.cover }} />
        <div className="md:col-span-3 p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] tracking-widest text-sage-dark font-medium">NEXT GATHERING</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-terracotta-soft text-terracotta-dark font-medium animate-pulse">
              {relativeFromNow(activity.startsAt)}
            </span>
          </div>
          <Link href={`/app/activity/${activity.id}`}>
            <h2 className="serif text-2xl text-ink hover:text-terracotta transition mb-2">{activity.title}</h2>
          </Link>
          <div className="text-sm text-ink/70 mb-1">📅 {formatLongDate(activity.startsAt)}</div>
          <div className="text-sm text-ink/70 mb-4">📍 {activity.location}</div>
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-sand">
            {host ? (
              <div className="flex items-center gap-2 text-sm text-ink/65">
                <Avatar member={host} size={24} />
                <span>{host.name} 發起 · {activity.rsvp.going} 人參加</span>
              </div>
            ) : <span />}
            <Link
              href={`/app/activity/${activity.id}`}
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
