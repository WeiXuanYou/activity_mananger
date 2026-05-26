import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { findPollDb, findMyVotesDb, listVotersByOptionDb } from "@/modules/core/polls";
import { Avatar, AvatarStack, findMemberDb, findMembersByIdsDb } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIdsDb } from "@/modules/core/categories";
import { VoteButton } from "./VoteButton";

type Params = { params: Promise<{ id: string }> };

export default async function AppPollDetailPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();

  const poll = await findPollDb(id);
  if (!poll) notFound();

  const [author, cats, myVotes, voterMap] = await Promise.all([
    findMemberDb(poll.authorId),
    findCategoriesByIdsDb(poll.categoryIds),
    findMyVotesDb(poll.id, me.id),
    poll.anonymous ? Promise.resolve({} as Record<string, string[]>) : listVotersByOptionDb(poll.id),
  ]);

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
            <span className="text-xs bg-sage/15 text-sage-dark px-2 py-1 rounded-full font-medium">📊 投票進行中</span>
            <span className="text-xs px-2 py-1 rounded-full bg-cream text-ink/70">
              {poll.multiSelect ? "可多選" : "單選"}
            </span>
            {poll.anonymous && (
              <span className="text-xs px-2 py-1 rounded-full bg-cream text-ink/70">🕶 匿名投票</span>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-terracotta-soft/50 text-terracotta-dark font-medium ml-auto">
              ⏰ {poll.closesIn}
            </span>
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

          <div className="space-y-3 mb-6">
            {poll.options.map((opt) => {
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
                />
              );
            })}

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
