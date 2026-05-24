import Link from "next/link";
import { Avatar, findMember } from "@/modules/core/members";
import {
  kpis, trendWeeks, topMembers, topPosts, votingPatterns, categoryDistribution,
  KpiCard, TrendChart,
} from "@/modules/analytics";

/**
 * Analytics dashboard — deliberately distinct chrome (dark slate header).
 * Reads ONLY from the analytics module — never from `core` tables.
 */
export default function AnalyticsMockup() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">ANALYTICS MODULE</span>
            <Link href="/mockup" className="text-sm text-white/60 hover:text-white">相聚 ·</Link>
            <span className="serif text-xl">分析</span>
          </div>
          <nav className="flex items-center gap-1 ml-2 text-sm">
            <button className="px-3 py-1.5 rounded-soft bg-white/10 text-white">總覽</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">投票</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">活動參與</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">內容熱度</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">分類分布</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">成員活躍度</button>
          </nav>
          <Link href="/mockup/feed" className="ml-auto text-xs text-white/60 hover:text-white">
            ← 回主應用
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-end gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-ink mb-1">過去 30 天總覽</h1>
            <p className="text-sm text-slate-500">資料來源：AnalyticsEvent 表 · 不直接讀 core 資料</p>
          </div>
          <div className="ml-auto flex gap-2 text-sm">
            <select className="px-3 py-1.5 rounded-soft border border-slate-200 bg-white">
              <option>過去 30 天</option>
              <option>過去 90 天</option>
              <option>本年度</option>
            </select>
            <button className="px-3 py-1.5 rounded-soft bg-white border border-slate-200 text-slate-600">⤓ 匯出</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-ink">活動參與趨勢</h3>
              <div className="flex gap-1 text-xs">
                <span className="px-2 py-0.5 bg-slate-100 rounded">活動</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">投票</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">留言</span>
              </div>
            </div>
            <TrendChart values={trendWeeks} />
          </div>

          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">最活躍成員</h3>
            <div className="space-y-3">
              {topMembers.map((t, i) => {
                const m = findMember(t.memberId);
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                    <Avatar member={m} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-ink truncate">{m.name}</div>
                      <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-slate-ink" style={{ width: `${100 - i * 18}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{t.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">熱門內容</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase">
                <tr className="border-b border-slate-200">
                  <th className="text-left pb-2 font-medium">標題</th>
                  <th className="text-right pb-2 font-medium">讚</th>
                  <th className="text-right pb-2 font-medium">留言</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {topPosts.map((p) => (
                  <tr key={p.title} className="border-b border-slate-100">
                    <td className="py-2.5 truncate max-w-[200px]">{p.title}</td>
                    <td className="text-right text-slate-500">{p.likes}</td>
                    <td className="text-right text-slate-500">{p.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">投票歷史偏好</h3>
            <p className="text-xs text-slate-500 mb-3">基於成員歷史投票（旅遊、餐廳、活動類型...）</p>
            <div className="space-y-2.5 text-sm">
              {votingPatterns.map((v) => (
                <div key={v.who} className="flex items-center gap-3 py-2 border-b border-slate-100">
                  <span className="font-medium text-slate-ink w-16">{v.who}</span>
                  <span className="flex-1 text-slate-600 text-xs">{v.tag}</span>
                  <span className="text-xs text-emerald-600 font-medium">{v.score} 一致</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category distribution */}
        <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-slate-ink mb-1">內容分類分布</h3>
          <p className="text-xs text-slate-500 mb-4">家裡的人最常聊什麼？</p>
          <div className="space-y-2">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 w-20">{c.name}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-ink" style={{ width: `${c.pct * 2.5}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-ink/5 rounded-soft border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-ink">模組邊界提示：</strong>
          這個儀表板只讀 <code className="bg-white px-1 rounded">AnalyticsEvent</code> 表的彙整。
          Core 模組透過 <code className="bg-white px-1 rounded">analytics.emit()</code> 單向發出事件——
          所以未來可以輕鬆抽成獨立服務或獨立 app，不影響社群核心。
        </div>
      </div>
    </main>
  );
}
