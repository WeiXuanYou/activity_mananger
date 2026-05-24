import type { Member } from "@/modules/core/members";

export function FeedHero({ member, newThisVisit }: { member: Member; newThisVisit: number }) {
  return (
    <section className="bg-gradient-to-br from-terracotta-soft/40 via-cream to-sage-soft/30 border-b border-sand/60">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center gap-4">
        <div className="text-4xl">🌿</div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="serif text-2xl text-ink">午安，{member.name}</h1>
          <p className="text-sm text-ink/65 mt-0.5">
            今天有 <strong className="text-terracotta-dark">{newThisVisit}</strong> 件新事——一場聚會、一個投票、一篇文章。
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur px-3 py-2 rounded-full text-xs text-ink/70">
          <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
          <span className="font-medium">5 人現在在線</span>
        </div>
      </div>
    </section>
  );
}
