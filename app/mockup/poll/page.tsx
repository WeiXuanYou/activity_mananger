import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { polls, members, findMember } from "../_data";
import { Avatar, AvatarStack } from "../_components/Avatar";

export default function PollMockup() {
  const poll = polls[1];
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

        <div className="bg-white rounded-soft shadow-soft border border-sand/60 p-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full">📊 投票進行中</span>
            <span className="text-xs text-ink/50">截止：{poll.closesAt}</span>
          </div>
          <h1 className="serif text-2xl md:text-3xl text-ink mb-2">{poll.question}</h1>
          <p className="text-sm text-ink/60 mb-6">{poll.totalVotes} 人已投票 · 由媽媽發起</p>

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
                      ? "bg-terracotta-soft/30 border-terracotta"
                      : "bg-cream/30 border-sand hover:border-terracotta/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-terracotta bg-terracotta" : "border-sand bg-white"
                      }`}
                    >
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="font-medium text-ink flex-1">{opt.label}</span>
                    <span className="text-sm text-ink/60">{opt.votes} 票 · {pct}%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div
                      className={selected ? "h-full bg-terracotta" : "h-full bg-terracotta-soft"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {voters.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <AvatarStack memberIds={voters} members={members} max={5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-sand">
            <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
              送出我的投票
            </button>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" className="rounded text-terracotta" />
              匿名投票
            </label>
            <span className="ml-auto text-xs text-ink/40">你還可以修改投票直到截止日</span>
          </div>
        </div>

        <div className="mt-6 bg-sage-soft/30 rounded-soft border border-sage/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-sage-dark font-medium">📈 分析模組</span>
          </div>
          <p className="text-sm text-ink/70 mb-3">
            這次投票的趨勢、家人的投票歷史比較，可在分析模組查看。
          </p>
          <Link
            href="/mockup/analytics"
            className="text-sm text-terracotta hover:underline font-medium"
          >
            前往分析儀表板 →
          </Link>
        </div>
      </div>
    </main>
  );
}
