import Link from "next/link";
import { Avatar } from "../_components/Avatar";
import { members, findMember } from "../_data";

/**
 * Analytics dashboard mockup. Visual chrome is intentionally different
 * (dark navy header, dashboard look) to emphasize the module boundary.
 */
export default function AnalyticsMockup() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Distinct dark header */}
      <header className="bg-slate-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">ANALYTICS MODULE</span>
            <Link href="/mockup" className="text-sm text-white/60 hover:text-white">家圈 ·</Link>
            <span className="serif text-xl">分析</span>
          </div>
          <nav className="flex items-center gap-1 ml-2 text-sm">
            <button className="px-3 py-1.5 rounded-soft bg-white/10 text-white">總覽</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">投票</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">活動參與</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">內容熱度</button>
            <button className="px-3 py-1.5 rounded-soft text-white/60 hover:bg-white/10">成員活躍度</button>
          </nav>
          <Link
            href="/mockup/feed"
            className="ml-auto text-xs text-white/60 hover:text-white"
          >
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

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "總投票數", value: "127", delta: "+18", color: "text-emerald-600" },
            { label: "活動 RSVP", value: "42", delta: "+6", color: "text-emerald-600" },
            { label: "文章發布", value: "23", delta: "+4", color: "text-emerald-600" },
            { label: "活躍成員", value: "11 / 14", delta: "+2", color: "text-emerald-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-soft border border-slate-200 p-4 shadow-sm">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{k.label}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-semibold text-slate-ink">{k.value}</div>
                <div className={`text-sm font-medium ${k.color}`}>↑ {k.delta}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Chart placeholder */}
          <div className="lg:col-span-2 bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-ink">活動參與趨勢</h3>
              <div className="flex gap-1 text-xs">
                <span className="px-2 py-0.5 bg-slate-100 rounded">活動</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">投票</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">留言</span>
              </div>
            </div>
            <div className="h-48 flex items-end gap-2 border-b border-slate-200 pb-2">
              {[34, 48, 52, 40, 62, 71, 58, 80, 92, 68, 76, 88].map((h, i) => (
                <div key={i} className="flex-1 h-full flex flex-col justify-end gap-0.5">
                  <div className="bg-slate-ink rounded-t" style={{ height: `${h}%` }} />
                  <div className="bg-slate-300 rounded-t" style={{ height: `${Math.round(h * 0.4)}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"].map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>

          {/* Most active member */}
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">最活躍成員</h3>
            <div className="space-y-3">
              {members.slice(0, 5).map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                  <Avatar member={m} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-ink truncate">{m.name}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-slate-ink" style={{ width: `${100 - i * 18}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{42 - i * 7}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top posts */}
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
                {[
                  ["外婆的紅燒肉食譜", 18, 6],
                  ["今天爸爸生日", 24, 9],
                  ["好用的露營椅推薦", 7, 3],
                  ["中秋活動籌備", 11, 14],
                ].map(([t, l, c]) => (
                  <tr key={t as string} className="border-b border-slate-100">
                    <td className="py-2.5 truncate max-w-[200px]">{t}</td>
                    <td className="text-right text-slate-500">{l}</td>
                    <td className="text-right text-slate-500">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Voting patterns */}
          <div className="bg-white rounded-soft border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-ink mb-3">投票歷史比較</h3>
            <p className="text-xs text-slate-500 mb-3">基於成員的歷史投票偏好（旅遊、餐廳、活動類型...）</p>
            <div className="space-y-2.5 text-sm">
              {[
                ["阿嬤", "傳統口味 / 室內活動", "92%"],
                ["媽媽", "戶外 / 健康類", "78%"],
                ["小明", "新潮口味 / 戶外", "85%"],
                ["雅婷", "美食 / 攝影", "71%"],
              ].map(([who, tag, score]) => (
                <div key={who} className="flex items-center gap-3 py-2 border-b border-slate-100">
                  <span className="font-medium text-slate-ink w-16">{who}</span>
                  <span className="flex-1 text-slate-600 text-xs">{tag}</span>
                  <span className="text-xs text-emerald-600 font-medium">{score} 一致</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-ink/5 rounded-soft border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-ink">模組邊界提示：</strong>
          這個儀表板只讀 <code className="bg-white px-1 rounded">AnalyticsEvent</code> 表的彙整。
          Core 模組（活動、投票、文章）透過 <code className="bg-white px-1 rounded">analytics.emit()</code> 單向發出事件——
          所以這個分析模組未來可以輕鬆抽成獨立服務或獨立 app，不影響社群核心。
        </div>
      </div>
    </main>
  );
}
