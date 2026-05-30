/**
 * Real DB-backed feed. End-to-end Phase C demo:
 *
 *   browser → middleware (cookie check) → AppLayout (session lookup)
 *   → THIS page → module queries (modules/core/x/db.ts) → Prisma → render
 *
 * No direct Prisma calls in this file — everything goes through module barrels.
 */
import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listPostsDb,
  findLikedPostIdsByUserDb,
  PostCard,
} from "@/modules/core/posts";
import {
  listUpcomingActivitiesDb,
  ActivityCard,
} from "@/modules/core/activities";
import { listPollsDb, PollCard } from "@/modules/core/polls";
import { listCategoriesDb, findCategoryBySlugDb, CategoryFilterBar } from "@/modules/core/categories";
import { formatShortDate, relativeFromNow } from "@/lib/date";
import { OwnerActions } from "@/modules/core/components/OwnerActions";
import { deletePostAction } from "@/modules/core/posts/actions";

type Search = { searchParams: Promise<{ cat?: string }> };

export default async function AppFeedPage({ searchParams }: Search) {
  const { cat: slug } = await searchParams;
  const me = await requireCurrentUser();

  // Fetch everything in parallel — they're independent queries
  const [posts, activities, polls, categories, activeCategory, canPost, canCreateActivity] =
    await Promise.all([
      listPostsDb(),
      listUpcomingActivitiesDb(),
      listPollsDb(),
      listCategoriesDb(),
      slug ? findCategoryBySlugDb(slug) : null,
      canCurrentUser("post.create"),
      canCurrentUser("activity.create"),
    ]);

  // Apply category filter on the joined client-side; cheap given dataset size
  const filteredPosts = activeCategory
    ? posts.filter((p) => p.categoryIds.includes(activeCategory.id))
    : posts;

  // One query for "which of these posts has the current user liked" so the
  // heart renders in the right state. Driven by the filtered list to avoid
  // wasted lookups when a category is selected.
  const likedIds = await findLikedPostIdsByUserDb(me.id, filteredPosts.map((p) => p.id));

  // Edit/delete is available when the current user owns the post or has
  // the moderate perm. Compute once for the whole list.
  const canModeratePosts = await canCurrentUser("post.moderate");

  return (
    <main className="max-w-6xl mx-auto px-5 py-6">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">REAL DB · /app</p>
        <h1 className="serif text-3xl text-ink">嗨，{me.name}</h1>
        <p className="text-ink/60 text-sm mt-1">
          你的角色：<strong className="text-ink/80">{me.role.name}</strong> ·
          資料完全來自 Prisma；按 RSVP / 投票 / 發文都會真的寫進 DB
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {canPost && (
            <Link
              href="/app/posts/new"
              className="px-3 py-1.5 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition"
            >
              + 寫一篇文章
            </Link>
          )}
          {!canCreateActivity && (
            <Link
              href="/app/permissions"
              className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 text-sm hover:bg-cream/40"
            >
              想建立活動？申請 Editor →
            </Link>
          )}
        </div>
      </div>

      <div className="mb-5">
        <CategoryFilterBar
          categories={categories}
          activeSlug={slug}
          basePath="/app/feed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 text-xs text-ink/40 px-1">
            <span>{activeCategory ? `「${activeCategory.name}」分類` : "📌 全部"}</span>
            <div className="flex-1 divider-dashed" />
            <span>{filteredPosts.length} 篇</span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
              <div className="text-4xl mb-2">🌿</div>
              <p className="serif text-lg text-ink/70">這個分類還沒有文章</p>
              <Link href="/app/feed" className="text-sm text-terracotta hover:underline">← 看全部</Link>
            </div>
          ) : (
            filteredPosts.map((p) => {
              const canEdit = canModeratePosts || p.authorId === me.id;
              // Bound server-action thunk — captures the post id so the
              // client OwnerActions doesn't need to know how delete works.
              const onDelete = async () => {
                "use server";
                await deletePostAction(p.id);
              };
              return (
                <PostCard
                  key={p.id}
                  post={p}
                  likedByMe={likedIds.has(p.id)}
                  ownerActions={
                    canEdit ? (
                      <OwnerActions
                        editHref={`/app/posts/${p.id}/edit`}
                        onDelete={onDelete}
                      />
                    ) : undefined
                  }
                />
              );
            })
          )}
        </section>

        <aside className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-base text-ink mb-3 flex items-center gap-2">
              <span>🗓</span> 即將到來
              <Link href="/app/activities" className="ml-auto text-xs text-ink/50 hover:text-terracotta">
                全部 →
              </Link>
            </h3>
            {activities.length === 0 && <p className="text-sm text-ink/55">沒有未來的活動</p>}
            <div className="space-y-3">
              {activities.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  href={`/app/activity/${a.id}`}
                  className="block group border-b border-sand pb-3 last:border-0"
                >
                  <div className="text-xs text-terracotta font-medium">
                    {formatShortDate(a.startsAt)} · {relativeFromNow(a.startsAt)}
                  </div>
                  <div className="text-sm text-ink group-hover:text-terracotta">{a.title}</div>
                  <div className="text-xs text-ink/55">
                    📍 {a.location} · {a.rsvp.going} 人參加
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-base text-ink mb-3">📊 進行中投票</h3>
            <div className="space-y-3">
              {polls.map((p) => (
                <Link key={p.id} href={`/app/poll/${p.id}`} className="block">
                  <PollCard poll={p} compact />
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/app/permissions"
            className="block bg-sage-soft/40 rounded-soft border border-sage/30 p-5 hover:bg-sage-soft/60 transition"
          >
            <div className="text-xs text-sage-dark font-medium mb-1">🛡 權限</div>
            <p className="text-sm text-ink/75 leading-relaxed">
              查看你的權限 / 申請升級
            </p>
          </Link>
        </aside>
      </div>
    </main>
  );
}
