/**
 * Real DB-backed feed. End-to-end Phase C demo:
 *
 *   browser → middleware (cookie check) → AppLayout (session lookup)
 *   → THIS page → module queries (modules/core/x/db.ts) → Prisma → render
 *
 * No direct Prisma calls in this file — everything goes through module
 * barrels. The user-facing copy stays consumer-friendly (no "REAL DB"
 * or "Prisma" leaks); the technical stack is documented in /preview.
 */
import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listPostsDb,
  countPostsDb,
  PostCard,
} from "@/modules/core/posts";
import { listUpcomingActivitiesDb } from "@/modules/core/activities";
import { listPollsDb, PollCard } from "@/modules/core/polls";
import { listCategoriesDb, findCategoryBySlugDb, CategoryFilterBar } from "@/modules/core/categories";
import { formatShortDate, relativeFromNow } from "@/lib/date";
import { OwnerActions } from "@/modules/core/components/OwnerActions";
import { deletePostAction, setPostHiddenAction } from "@/modules/core/posts/actions";
import { listMemoriesForToday, MemoriesCard } from "@/modules/core/memories";
import { listUpcomingBirthdays, BirthdayWidget } from "@/modules/core/birthdays";
import { getReactionSummariesDb } from "@/modules/reactions";

/** How many posts the feed shows before "看更多". Tuned for a phone-first
 *  timeline — enough to feel full, not so many that the page is endless. */
const FEED_PAGE_SIZE = 15;

type Search = { searchParams: Promise<{ cat?: string; show?: string; hidden?: string }> };

export default async function AppFeedPage({ searchParams }: Search) {
  const { cat: slug, show, hidden } = await searchParams;
  const me = await requireCurrentUser();

  // How many to show this render. ?show=N grows the window ("看更多").
  const showCount = Math.max(FEED_PAGE_SIZE, Number.parseInt(show ?? "", 10) || FEED_PAGE_SIZE);

  // Resolve the active category first — needed for the paginated query.
  const [categories, activeCategory, canPost, canCreateCategory, canModeratePosts] =
    await Promise.all([
      listCategoriesDb(),
      slug ? findCategoryBySlugDb(slug) : null,
      canCurrentUser("post.create"),
      canCurrentUser("category.create"),
      canCurrentUser("post.moderate"),
    ]);

  // Admins can flip on "show hidden" to review hidden posts. Everyone else
  // only ever sees their own hidden posts (handled by viewerId below).
  const showHidden = canModeratePosts && hidden === "1";

  const postOpts = {
    viewerId: me.id,
    includeHidden: showHidden,
    categoryId: activeCategory?.id,
  };

  // Fetch the visible page of posts + the total + side widgets in parallel.
  const [posts, totalPosts, activities, polls] = await Promise.all([
    listPostsDb({ ...postOpts, take: showCount }),
    countPostsDb(postOpts),
    listUpcomingActivitiesDb(),
    listPollsDb(),
  ]);

  const filteredPosts = posts;
  const hasMore = totalPosts > filteredPosts.length;

  // Reaction summaries (counts per emoji + the viewer's pick) for every
  // visible post — two queries total via the batch helper.
  const reactionSummaries = await getReactionSummariesDb(
    "POST",
    filteredPosts.map((p) => p.id),
    me.id,
  );

  // Preserve cat when building the "看更多" link.
  const moreHref = (() => {
    const params = new URLSearchParams();
    if (slug) params.set("cat", slug);
    if (showHidden) params.set("hidden", "1");
    params.set("show", String(showCount + FEED_PAGE_SIZE));
    return `/app/feed?${params.toString()}`;
  })();

  // "On this day" memories — only same-MM-DD content from prior years.
  // Quietly omitted on the feed if there's nothing to surface.
  const [memories, birthdays] = await Promise.all([
    listMemoriesForToday(),
    listUpcomingBirthdays(14),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">動態</p>
        <h1 className="serif text-3xl text-ink">嗨，{me.name}</h1>
        <p className="text-ink/60 text-sm mt-1">
          看看大家最近在做什麼，或<Link href="/app/posts/new" className="text-terracotta hover:underline">寫點什麼</Link>給其他人。
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
          <Link
            href="/app/activities/new"
            className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/75 text-sm hover:bg-cream/40"
          >
            + 辦一場活動
          </Link>
          <Link
            href="/app/polls/new"
            className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/75 text-sm hover:bg-cream/40"
          >
            + 起一個投票
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <CategoryFilterBar
          categories={categories}
          activeSlug={slug}
          basePath="/app/feed"
          canCreate={canCreateCategory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 text-xs text-ink/40 px-1">
            <span>{activeCategory ? `「${activeCategory.name}」分類` : "📌 全部"}</span>
            {showHidden && <span className="text-terracotta-dark">· 含隱藏</span>}
            <div className="flex-1 divider-dashed" />
            <span>{filteredPosts.length} / {totalPosts} 篇</span>
            {canModeratePosts && (
              <Link
                href={showHidden
                  ? `/app/feed${slug ? `?cat=${slug}` : ""}`
                  : `/app/feed?${new URLSearchParams({ ...(slug ? { cat: slug } : {}), hidden: "1" }).toString()}`}
                className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] transition ${
                  showHidden
                    ? "bg-terracotta-soft/50 border-terracotta/30 text-terracotta-dark"
                    : "bg-white border-sand text-ink/55 hover:bg-cream/40"
                }`}
              >
                {showHidden ? "✓ 顯示隱藏貼文" : "👁 顯示隱藏貼文"}
              </Link>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            // Two distinct empty paths:
            //  (a) global empty — fresh install, no posts at all yet → give
            //      actionable next steps (write the first one, invite people)
            //  (b) category empty — content exists, just not in this filter →
            //      offer to clear the filter
            posts.length === 0 ? (
              <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
                <div className="text-4xl mb-2">🌱</div>
                <p className="serif text-lg text-ink/70 mb-1">這裡還很安靜</p>
                <p className="text-sm text-ink/55 mb-4">
                  寫第一篇文章、辦一場活動，或是邀請家人朋友加入吧。
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {canPost && (
                    <Link href="/app/posts/new" className="text-sm px-4 py-2 rounded-soft bg-terracotta text-white hover:bg-terracotta-dark">
                      ✍ 寫第一篇
                    </Link>
                  )}
                  <Link href="/app/activities/new" className="text-sm px-4 py-2 rounded-soft bg-white border border-sand text-ink/75 hover:bg-cream/40">
                    🍖 辦一場活動
                  </Link>
                  <Link href="/app/admin" className="text-sm px-4 py-2 rounded-soft bg-white border border-sand text-ink/75 hover:bg-cream/40">
                    ✉ 產生邀請碼
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
                <div className="text-4xl mb-2">🌿</div>
                <p className="serif text-lg text-ink/70">這個分類還沒有文章</p>
                <Link href="/app/feed" className="text-sm text-terracotta hover:underline">← 看全部</Link>
              </div>
            )
          ) : (
            filteredPosts.map((p) => {
              const isOwnerOrMod = canModeratePosts || p.authorId === me.id;
              // Collaborators (post opened for collab) can edit but not
              // delete / hide — so they get a plain edit link, not the menu.
              const canCollabEdit = !isOwnerOrMod && Boolean(p.allowCollab);
              // Bound server-action thunks — capture the post id so the
              // client OwnerActions doesn't need to know how the actions work.
              const onDelete = async () => {
                "use server";
                await deletePostAction(p.id);
              };
              const onToggleHidden = async (next: boolean) => {
                "use server";
                await setPostHiddenAction(p.id, next);
              };
              return (
                <div key={p.id} className={p.hiddenAt ? "relative opacity-75" : undefined}>
                  {p.hiddenAt && (
                    <span className="absolute z-10 left-3 top-3 text-[10px] px-2 py-0.5 rounded-full bg-ink/70 text-white">
                      🙈 已隱藏{p.authorId === me.id ? "（只有你和管理員看得到）" : ""}
                    </span>
                  )}
                  <PostCard
                    post={p}
                    reactionSummary={reactionSummaries.get(p.id)}
                    ownerActions={
                      isOwnerOrMod ? (
                        <OwnerActions
                          editHref={`/app/posts/${p.id}/edit`}
                          onDelete={onDelete}
                          onToggleHidden={onToggleHidden}
                          hidden={Boolean(p.hiddenAt)}
                        />
                      ) : canCollabEdit ? (
                        <Link
                          href={`/app/posts/${p.id}/edit`}
                          title="協作編輯"
                          className="w-8 h-8 rounded-full text-ink/40 hover:text-ink hover:bg-cream/70 transition flex items-center justify-center text-sm"
                        >
                          ✎
                        </Link>
                      ) : undefined
                    }
                  />
                </div>
              );
            })
          )}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <Link
                href={moreHref}
                className="px-5 py-2.5 rounded-soft bg-white border border-sand text-sm text-ink/75 hover:bg-cream/40 transition shadow-card"
              >
                看更多文章（還有 {totalPosts - filteredPosts.length} 篇）
              </Link>
            </div>
          )}
          {!hasMore && totalPosts > FEED_PAGE_SIZE && (
            <p className="pt-2 text-center text-xs text-ink/40">
              已經到底了 · 想找更早的內容可以用<Link href="/app/search" className="text-terracotta hover:underline">搜尋</Link>
            </p>
          )}
        </section>

        <aside className="lg:col-span-5 space-y-5">
          <BirthdayWidget birthdays={birthdays} />
          <MemoriesCard memories={memories} />
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
