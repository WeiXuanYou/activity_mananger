import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { findPollDb, findMyVotesDb, listVotersByOptionDb } from "@/modules/core/polls";
import { Avatar, AvatarStack, findMemberDb, findMembersByIdsDb } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIdsDb } from "@/modules/core/categories";
import { canCurrentUser } from "@/modules/permissions";
import { OwnerActions } from "@/modules/core/components/OwnerActions";
import { deletePollAction } from "@/modules/core/polls/actions";
import { VoteButton } from "./VoteButton";

type Params = { params: Promise<{ id: string }> };

export default async function AppPollDetailPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();

  const poll = await findPollDb(id);
  if (!poll) notFound();

  const [author, cats, myVotes, voterMap, canModerate] = await Promise.all([
    findMemberDb(poll.authorId),
    findCategoriesByIdsDb(poll.categoryIds),
    findMyVotesDb(poll.id, me.id),
    poll.anonymous ? Promise.resolve({} as Record<string, string[]>) : listVotersByOptionDb(poll.id),
    canCurrentUser("poll.moderate"),
  ]);
  const canEditPoll = poll.authorId === me.id || canModerate;
  const handleDelete = async () => {
    "use server";
    await deletePollAction(poll.id);
  };

  // Resolve voter user-ids → Member shape for avatar display
  const allVoterIds = Array.from(new Set(Object.values(voterMap).flat()));
  const voters = await findMembersByIdsDb(allVoterIds);

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>

      <div className="bg-white rounded-soft shadow-soft border border-sand/60 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sage via-terracotta-soft to-terracotta" />

        <div className="p-7">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              poll.kind === "SCHEDULE"
                ? "bg-terracotta-soft/60 text-terracotta-dark"
                : "bg-sage/15 text-sage-dark"
            }`}>
              {poll.kind === "SCHEDULE" ? "📅 排程投票" : "📊 投票進行中"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-cream text-ink/70">
              {poll.multiSelect ? "可多選" : "單選"}
            </span>
            {poll.anonymous && (
              <span className="text-xs px-2 py-1 rounded-full bg-cream text-ink/70">🕶 匿名投票</span>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-terracotta-soft/50 text-terracotta-dark font-medium ml-auto">
              ⏰ {poll.closesIn}
            </span>
            {canEditPoll && (
              <OwnerActions
                editHref={`/app/polls/${poll.id}/edit`}
                onDelete={handleDelete}
                redirectTo="/app/feed"
              />
            )}
          </div>

          <h1 className="serif text-2xl md:text-3xl text-ink mb-2 leading-snug">{poll.question}</h1>

          {author && (
            <div className="flex items-center gap-2 mb-3 text-sm text-ink/60">
              <Avatar member={author} size={24} />
              <span>{author.name} 發起 · {poll.totalVotes} 票 · 截止 {poll.closesAt}</span>
            </div>
          )}

          {cats.length > 0 && (
            <div className="mb-5"><CategoryChipList categories={cats} /></div>
          )}

          {/* For SCHEDULE polls, surface the "most-available time" up top */}
          {poll.kind === "SCHEDULE" && poll.totalVotes > 0 && (() => {
            const top = poll.options.reduce<typeof poll.options[number] | null>(
              (best, o) => (!best || o.votes > best.votes ? o : best), null,
            );
            if (!top || top.votes === 0) return null;
            const d = new Date(top.label);
            const label = Number.isNaN(d.getTime())
              ? top.label
              : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            return (
              <div className="mb-5 rounded-soft border border-terracotta/30 bg-gradient-to-br from-terracotta-soft/30 to-cream px-4 py-3">
                <div className="text-[10px] text-terracotta-dark/70 font-medium tracking-widest">👑 目前共同最佳時段</div>
                <div className="serif text-xl text-ink mt-1">{label}</div>
                <div className="text-xs text-ink/60 mt-1">{top.votes} 人可以 / 共 {poll.totalVotes} 票 · 投票結束會以此為準</div>
              </div>
            );
          })()}

          <div className="space-y-3 mb-6">
            {(() => {
              const topId = poll.options.reduce<typeof poll.options[number] | null>(
                (best, o) => (!best || o.votes > best.votes ? o : best), null,
              )?.id;
              return poll.options.map((opt) => {
                const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                const optVoterIds = voterMap[opt.id] || [];
                const optVoters = voters.filter((v) => optVoterIds.includes(v.id));
                const selected = myVotes.includes(opt.id);
                return (
                  <VoteButton
                    key={opt.id}
                    pollId={poll.id}
                    option={opt}
                    multiSelect={poll.multiSelect}
                    selected={selected}
                    pct={pct}
                    voters={optVoters}
                    anonymous={poll.anonymous}
                    isSchedule={poll.kind === "SCHEDULE"}
                    isTop={poll.kind === "SCHEDULE" && opt.id === topId && opt.votes > 0}
                  />
                );
              });
            })()}

            {poll.allowAddOption && (
              <p className="text-xs text-ink/50 px-1">
                💡 此投票允許新增選項（功能 wiring 在下一階段加入）
              </p>
            )}
          </div>

          <div className="pt-5 border-t border-sand text-xs text-ink/55 leading-relaxed">
            <strong className="text-ink/80">提示：</strong>
            點按選項會即時寫入 <code className="text-terracotta">PollVote</code>；
            再次點按可取消你的投票。{poll.multiSelect ? "" : "單選——點別的選項會自動換。"}
          </div>
        </div>
      </div>
    </main>
  );
}
