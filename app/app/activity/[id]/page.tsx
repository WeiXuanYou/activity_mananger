import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { findActivityDb, findMyRsvpDb } from "@/modules/core/activities";
import { Avatar, findMemberDb } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIdsDb } from "@/modules/core/categories";
import { canCurrentUser } from "@/modules/permissions";
import { listCommentsDb, CommentList, CommentForm } from "@/modules/comments";
import { formatLongDate, relativeFromNow } from "@/lib/date";
import { RsvpButtons } from "./RsvpButtons";
import { OwnerActions } from "@/modules/core/components/OwnerActions";
import { deleteActivityAction, setActivityHiddenAction } from "@/modules/core/activities/actions";
import { getActivityExpenseSummary, ExpensePanel } from "@/modules/core/expenses";
import { listLodgingForLocationDb } from "@/modules/core/lodging";

type Params = { params: Promise<{ id: string }> };

export default async function AppActivityDetailPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();

  const activity = await findActivityDb(id);
  if (!activity) notFound();

  const [host, cats, myRsvp, comments, canModerate, canActivityModerate, expenseSummary, lodging] = await Promise.all([
    findMemberDb(activity.hostId),
    findCategoriesByIdsDb(activity.categoryIds),
    findMyRsvpDb(activity.id, me.id),
    listCommentsDb("ACTIVITY", activity.id),
    canCurrentUser("comment.moderate"),
    canCurrentUser("activity.moderate"),
    getActivityExpenseSummary(activity.id),
    listLodgingForLocationDb(activity.location),
  ]);

  const canEditActivity = activity.hostId === me.id || canActivityModerate;
  // Server-action thunk for the OwnerActions client component (server
  // actions can be passed across the boundary as long as we keep the
  // closure tiny). The action revalidates the cache + we redirect.
  const handleDelete = async () => {
    "use server";
    await deleteActivityAction(activity.id);
  };
  const handleToggleHidden = async (next: boolean) => {
    "use server";
    await setActivityHiddenAction(activity.id, next);
  };

  // Adapt the session user (DB shape) into the Member shape the components want
  const meMember = {
    id: me.id, name: me.name, handle: me.handle,
    role: me.role.name as "Guest" | "Member" | "Editor" | "Admin",
    avatarColor: me.avatarColor, initial: me.initial,
    avatarImage: me.avatarImage ?? null,
  };

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
      <Link href="/app/activities" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回活動列表
      </Link>

      {activity.hiddenAt && (
        <div className="mb-4 rounded-soft border border-sand bg-cream/60 px-4 py-3 text-sm text-ink/70 flex items-center gap-2">
          <span>🙈</span>
          <span>這個活動已被隱藏，只有有連結的人或管理員看得到。</span>
        </div>
      )}

      <div className="bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 mb-6">
        <div className="h-32 sm:h-48 md:h-64 relative" style={{ background: activity.cover }}>
          <span className="absolute top-4 left-4 bg-white/90 text-terracotta text-xs font-medium px-2.5 py-1 rounded-full">
            即將舉行
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-terracotta-soft/60 text-terracotta-dark font-medium animate-pulse">
              ⏳ {relativeFromNow(activity.startsAt)}
            </span>
            <CategoryChipList categories={cats} size="xs" />
            {canEditActivity && (
              <div className="ml-auto">
                <OwnerActions
                  editHref={`/app/activities/${activity.id}/edit`}
                  onDelete={handleDelete}
                  onToggleHidden={handleToggleHidden}
                  hidden={Boolean(activity.hiddenAt)}
                  redirectTo="/app/activities"
                />
              </div>
            )}
          </div>
          <h1 className="serif text-2xl sm:text-3xl text-ink mb-2">{activity.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60 mb-4">
            <span>🗓️ {formatLongDate(activity.startsAt)}</span>
            <span>📍 {activity.location}</span>
          </div>

          {host && (
            <Link href={`/app/members/${host.id}`} className="inline-flex items-center gap-2 mb-5 hover:opacity-80 transition">
              <Avatar member={host} size={28} />
              <span className="text-sm text-ink/70">
                由 <span className="font-medium text-ink hover:text-terracotta">{host.name}</span> 發起
              </span>
            </Link>
          )}

          <p className="text-ink/80 leading-relaxed mb-6">{activity.description}</p>

          <RsvpButtons activityId={activity.id} current={myRsvp} counts={activity.rsvp} />
        </div>
      </div>

      {/* Expenses / split */}
      <ExpensePanel
        activityId={activity.id}
        summary={expenseSummary}
        currentUserId={me.id}
        hostId={activity.hostId}
        canModerate={canActivityModerate}
      />

      {/* Lodging hints — region match against this activity's location */}
      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-4 sm:p-6 mb-6">
        <div className="flex items-baseline gap-2 mb-3 flex-wrap">
          <h2 className="serif text-lg sm:text-xl text-ink flex items-center gap-2">
            🏨 此地區的住宿
          </h2>
          <span className="text-xs text-ink/40">{lodging.length} 筆</span>
          <Link
            href={`/app/lodging/new?activity=${activity.id}&region=${encodeURIComponent(activity.location)}`}
            className="ml-auto text-xs text-terracotta hover:underline"
          >
            + 加一筆
          </Link>
        </div>
        {lodging.length === 0 ? (
          <p className="text-sm text-ink/55">
            「{activity.location}」這個地區還沒有住宿紀錄。
            <Link
              href={`/app/lodging/new?activity=${activity.id}&region=${encodeURIComponent(activity.location)}`}
              className="text-terracotta hover:underline ml-1"
            >
              加一個推薦或記錄住過的地方？
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-sand">
            {lodging.slice(0, 5).map((l) => (
              <li key={l.id} className="py-2 flex items-center gap-3 text-sm">
                <span>{l.stayedAt ? "✓" : "·"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-ink truncate">{l.name}</div>
                  <div className="text-xs text-ink/55 truncate">
                    {l.region}
                    {l.rating ? ` · ${"★".repeat(l.rating)}` : ""}
                    {l.pricePerNightCents != null ? ` · ${l.currency} ${Math.round(l.pricePerNightCents/100)}/晚` : ""}
                  </div>
                </div>
                {l.url && (
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-terracotta hover:underline shrink-0">網站</a>
                )}
              </li>
            ))}
            {lodging.length > 5 && (
              <li className="pt-2 text-xs text-ink/45">
                <Link href="/app/lodging" className="hover:text-terracotta">查看全部 {lodging.length} 筆 →</Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Comments */}
      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-4 sm:p-6 mb-6">
        <h2 className="serif text-lg sm:text-xl text-ink mb-4 flex items-center gap-2">
          💬 留言
          <span className="text-sm text-ink/40 font-sans">({comments.length})</span>
        </h2>
        <div className="mb-5">
          <CommentList
            comments={comments}
            currentUserId={me.id}
            canModerate={canModerate}
            parentType="ACTIVITY"
            parentId={activity.id}
            meMember={meMember}
          />
        </div>
        <CommentForm me={meMember} parentType="ACTIVITY" parentId={activity.id} />
      </section>

      <div className="bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        RSVP 與留言都會立即寫入 DB，留言並會通知活動發起人。
      </div>
    </main>
  );
}
