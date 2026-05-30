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

type Params = { params: Promise<{ id: string }> };

export default async function AppActivityDetailPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();

  const activity = await findActivityDb(id);
  if (!activity) notFound();

  const [host, cats, myRsvp, comments, canModerate] = await Promise.all([
    findMemberDb(activity.hostId),
    findCategoriesByIdsDb(activity.categoryIds),
    findMyRsvpDb(activity.id, me.id),
    listCommentsDb("ACTIVITY", activity.id),
    canCurrentUser("comment.moderate"),
  ]);

  // Adapt the session user (DB shape) into the Member shape the components want
  const meMember = {
    id: me.id, name: me.name, handle: me.handle,
    role: me.role.name as "Guest" | "Member" | "Editor" | "Admin",
    avatarColor: me.avatarColor, initial: me.initial,
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-6">
      <Link href="/app/activities" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回活動列表
      </Link>

      <div className="bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 mb-6">
        <div className="h-48 md:h-64 relative" style={{ background: activity.cover }}>
          <span className="absolute top-4 left-4 bg-white/90 text-terracotta text-xs font-medium px-2.5 py-1 rounded-full">
            即將舉行
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-terracotta-soft/60 text-terracotta-dark font-medium animate-pulse">
              ⏳ {relativeFromNow(activity.startsAt)}
            </span>
            <CategoryChipList categories={cats} size="xs" />
          </div>
          <h1 className="serif text-3xl text-ink mb-2">{activity.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60 mb-4">
            <span>🗓️ {formatLongDate(activity.startsAt)}</span>
            <span>📍 {activity.location}</span>
          </div>

          {host && (
            <div className="flex items-center gap-2 mb-5">
              <Avatar member={host} size={28} />
              <span className="text-sm text-ink/70">
                由 <span className="font-medium text-ink">{host.name}</span> 發起
              </span>
            </div>
          )}

          <p className="text-ink/80 leading-relaxed mb-6">{activity.description}</p>

          <RsvpButtons activityId={activity.id} current={myRsvp} counts={activity.rsvp} />
        </div>
      </div>

      {/* Comments */}
      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-6 mb-6">
        <h2 className="serif text-xl text-ink mb-4 flex items-center gap-2">
          💬 留言
          <span className="text-sm text-ink/40 font-sans">({comments.length})</span>
        </h2>
        <div className="mb-5">
          <CommentList comments={comments} currentUserId={me.id} canModerate={canModerate} />
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
