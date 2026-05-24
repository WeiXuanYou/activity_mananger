import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import { Avatar, AvatarStack, findMember, listMembers } from "@/modules/core/members";
import { listPolls } from "@/modules/core/polls";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";

export default function PollMockup() {
  const poll = listPolls()[1];
  const author = findMember(poll.authorId);
  const members = listMembers();
  const cats = findCategoriesByIds(poll.categoryIds);
  const voterIdsByOption: Record<string, string[]> = {
    o1: ["u1", "u3", "u4"],
    o2: ["u2", "u3", "u4", "u5"],
    o3: ["u1", "u2"],
    o4: ["u5"],
  };

  return (
    <main>
      <MockNav />
      <div className="max-w-3xl mx-auto px-5 py-8">
        <Link href="/mockup/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
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

            <div className="flex items-center gap-2 mb-3 text-sm text-ink/60">
              <Avatar member={author} size={24} />
              <span>{author.name} 發起 · {poll.totalVotes} 票 · 截止 {poll.closesAt}</span>
            </div>

            {cats.length > 0 && (
              <div className="mb-5"><CategoryChipList categories={cats} /></div>
            )}

            <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-terracotta-soft/40 to-cream rounded-soft p-4 border border-terracotta/20">
              <div className="text-3xl">⏳</div>
              <div className="flex-1">
                <div className="text-xs text-terracotta-dark font-medium mb-0.5">距離截止還有</div>
                <div className="flex items-baseline gap-3 serif text-ink">
                  <span><span className="text-2xl font-semibold">9</span> 天</span>
                  <span><span className="text-2xl font-semibold">14</span> 小時</span>
                  <span><span className="text-2xl font-semibold">23</span> 分</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {poll.options.map((opt, i) => {
                const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                const voters = voterIdsByOption[opt.id] || [];
                const selected = i === 1;
                return (
                  <button
                    key={opt.id}
                    className={`w-full text-left rounded-soft border p-4 transition ${
                      selected
                        ? "bg-terracotta-soft/30 border-terracotta shadow-card"
                        : "bg-cream/30 border-sand hover:border-terracotta/50 hover:bg-cream/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-5 h-5 ${poll.multiSelect ? "rounded" : "rounded-full"} border-2 flex items-center justify-center ${
                          selected ? "border-terracotta bg-terracotta" : "border-sand bg-white"
                        }`}
                      >
                        {selected && (
                          poll.multiSelect ? (
                            <span className="text-white text-xs leading-none">✓</span>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )
                        )}
                      </div>
                      <span className="font-medium text-ink flex-1">{opt.label}</span>
                      <span className="text-sm text-ink/60 whitespace-nowrap">{opt.votes} 票 · {pct}%</span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full overflow-hidden mb-2">
                      <div
                        className={
                          selected
                            ? "h-full bg-gradient-to-r from-terracotta to-terracotta-dark"
                            : "h-full bg-gradient-to-r from-terracotta-soft to-terracotta/60"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {!poll.anonymous && voters.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <AvatarStack memberIds={voters} members={members} max={5} />
                      </div>
                    )}
                    {poll.anonymous && voters.length > 0 && (
                      <div className="text-xs text-ink/40">{voters.length} 位投了這個</div>
                    )}
                  </button>
                );
              })}

              {poll.allowAddOption && (
                <button className="w-full text-left rounded-soft border-2 border-dashed border-sand p-4 text-ink/60 hover:border-terracotta hover:bg-cream/40 transition">
                  ＋ 新增一個選項（發起人允許）
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-sand">
              <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
                送出我的投票
              </button>
              <button className="px-4 py-2.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 text-sm">
                📌 在 Feed 置頂
              </button>
              <button className="px-4 py-2.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 text-sm">
                🔗 分享連結
              </button>
              <span className="ml-auto text-xs text-ink/40">你可以修改投票直到截止</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-base text-ink mb-3">⚙️ 投票設定</h3>
            <ul className="text-sm space-y-1.5 text-ink/70">
              <li className="flex justify-between"><span>類型</span><span className="text-ink">{poll.multiSelect ? "多選" : "單選"}</span></li>
              <li className="flex justify-between"><span>匿名</span><span className="text-ink">{poll.anonymous ? "是" : "否"}</span></li>
              <li className="flex justify-between"><span>可新增選項</span><span className="text-ink">{poll.allowAddOption ? "可以" : "不行"}</span></li>
              <li className="flex justify-between"><span>截止時間</span><span className="text-ink">{poll.closesAt} 23:59</span></li>
            </ul>
          </div>

          <div className="bg-sage-soft/30 rounded-soft border border-sage/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-sage-dark font-medium">📈 分析模組</span>
            </div>
            <p className="text-sm text-ink/70 mb-3 leading-relaxed">
              這次投票的趨勢、家人朋友的投票歷史比較，可在分析模組查看。
            </p>
            <Link
              href="/mockup/analytics"
              className="text-sm text-terracotta hover:underline font-medium"
            >
              前往分析儀表板 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
