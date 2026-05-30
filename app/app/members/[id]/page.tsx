import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { Avatar, findMemberDb } from "@/modules/core/members";
import { listPostsDb, PostCard, findLikedPostIdsByUserDb } from "@/modules/core/posts";
import { listActivitiesDb, ActivityCard } from "@/modules/core/activities";
import { listPollsDb, PollCard } from "@/modules/core/polls";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const ROLE_LABEL: Record<string, string> = {
  Guest: "訪客",
  Member: "成員",
  Editor: "編輯",
  Admin: "管理員",
};

const ROLE_COLOR: Record<string, string> = {
  Guest: "bg-ink/10 text-ink/60",
  Member: "bg-sage-soft/60 text-sage-dark",
  Editor: "bg-terracotta-soft/60 text-terracotta-dark",
  Admin: "bg-ink/80 text-cream",
};

export default async function MemberProfilePage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const member = await findMemberDb(id);
  if (!member) notFound();

  // Pull everything in parallel — small dataset; in-memory filter is fine.
  // commentCount goes direct-to-Prisma since the comments module groups by
  // parentType+parentId, not by author.
  const [allPosts, allActivities, allPolls, commentCount, joinedAtRow] = await Promise.all([
    listPostsDb(),
    listActivitiesDb(),
    listPollsDb(),
    db.comment.count({ where: { authorId: id } }),
    db.user.findUnique({ where: { id }, select: { createdAt: true } }),
  ]);

  const myPosts = allPosts.filter((p) => p.authorId === id);
  const myActivities = allActivities.filter((a) => a.hostId === id);
  const myPolls = allPolls.filter((p) => p.authorId === id);

  // Liked-state for the posts we'll render (so the heart shows correctly)
  const likedIds = await findLikedPostIdsByUserDb(me.id, myPosts.map((p) => p.id));

  const joinedAt = joinedAtRow?.createdAt
    ? joinedAtRow.createdAt.toLocaleDateString("zh-TW", { year: "numeric", month: "long" })
    : "";

  const isMe = member.id === me.id;

  return (
    <main className="max-w-5xl mx-auto px-5 py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>

      {/* Profile header card */}
      <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar member={member} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="serif text-3xl text-ink">{member.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[member.role] ?? ""}`}>
                {ROLE_LABEL[member.role] ?? member.role}
              </span>
              {isMe && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-ink/60 font-medium">這是你</span>
              )}
            </div>
            <p className="text-ink/55 text-sm">@{member.handle}</p>
            {joinedAt && <p className="text-ink/45 text-xs mt-1">加入於 {joinedAt}</p>}
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-sand">
          <Stat label="文章" value={myPosts.length} emoji="📝" />
          <Stat label="活動" value={myActivities.length} emoji="🍖" />
          <Stat label="投票" value={myPolls.length} emoji="📊" />
          <Stat label="留言" value={commentCount} emoji="💬" />
        </div>
      </div>

      {/* Activities */}
      {myActivities.length > 0 && (
        <Section title="🍖 發起的活動">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActivities.map((a) => (
              <Link key={a.id} href={`/app/activity/${a.id}`} className="block">
                <ActivityCard activity={a} />
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Polls */}
      {myPolls.length > 0 && (
        <Section title="📊 發起的投票">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPolls.map((p) => (
              <Link key={p.id} href={`/app/poll/${p.id}`} className="block">
                <PollCard poll={p} />
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Posts */}
      {myPosts.length > 0 && (
        <Section title="📝 發過的文章">
          <div className="space-y-4">
            {myPosts.map((p) => (
              <PostCard key={p.id} post={p} likedByMe={likedIds.has(p.id)} />
            ))}
          </div>
        </Section>
      )}

      {myPosts.length + myActivities.length + myPolls.length === 0 && (
        <div className="bg-cream/40 rounded-soft border border-sand p-8 text-center text-ink/55 text-sm">
          {member.name} 還沒發布任何內容。
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="rounded-soft bg-cream/40 px-4 py-3">
      <div className="text-xs text-ink/50">{emoji} {label}</div>
      <div className="serif text-2xl text-ink mt-0.5">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="serif text-xl text-ink mb-3">{title}</h2>
      {children}
    </section>
  );
}
