"use client";
import Link from "next/link";
import { useState } from "react";
import { MockNav } from "../_components/MockNav";

type Tab = "post" | "activity" | "poll";

export default function CreateMockup() {
  const [tab, setTab] = useState<Tab>("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  return (
    <main>
      <MockNav active="/mockup/create" />
      <div className="max-w-5xl mx-auto px-5 py-6">
        <h1 className="serif text-3xl text-ink mb-1">建立內容</h1>
        <p className="text-ink/60 text-sm mb-6">分享給家人和朋友</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-cream/50 p-1 rounded-soft inline-flex">
          {([
            { k: "post", l: "📝 文章 / 推薦" },
            { k: "activity", l: "🍖 活動" },
            { k: "poll", l: "📊 投票" },
          ] as { k: Tab; l: string }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2 rounded-soft text-sm font-medium transition ${
                tab === t.k ? "bg-white text-ink shadow-card" : "text-ink/60 hover:text-ink"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <section className="bg-white rounded-soft shadow-card border border-sand/60 p-6">
            {tab === "post" && (
              <div className="space-y-4">
                <select className="w-full px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm">
                  <option>📝 文章</option>
                  <option>⭐ 推薦</option>
                  <option>💭 隨筆</option>
                </select>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="標題（可選）"
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="寫下你想分享的內容..."
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
                  rows={10}
                />
                <div className="flex gap-2 text-ink/60 text-sm">
                  <button className="px-3 py-1.5 rounded-soft bg-cream/50 hover:bg-cream">📷 圖片</button>
                  <button className="px-3 py-1.5 rounded-soft bg-cream/50 hover:bg-cream">🔗 連結</button>
                </div>
              </div>
            )}

            {tab === "activity" && (
              <div className="space-y-4">
                <input
                  placeholder="活動名稱"
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="datetime-local" className="px-3 py-2.5 rounded-soft border border-sand bg-cream/30" />
                  <input placeholder="地點" className="px-3 py-2.5 rounded-soft border border-sand bg-cream/30" />
                </div>
                <textarea
                  placeholder="活動描述..."
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
                  rows={6}
                />
                <label className="flex items-center gap-2 text-sm text-ink/70 bg-sage-soft/30 px-3 py-2 rounded-soft border border-sage/20">
                  <input type="checkbox" className="rounded text-terracotta" defaultChecked />
                  <span>同時建立內嵌投票</span>
                </label>
                <div className="text-xs text-ink/50 bg-terracotta-soft/30 px-3 py-2 rounded-soft border border-terracotta/20">
                  💡 「建立活動」需要 <strong>Editor</strong> 權限。你目前是 Member ——
                  <Link href="/mockup/permissions" className="text-terracotta hover:underline ml-1">
                    申請更高權限
                  </Link>
                </div>
              </div>
            )}

            {tab === "poll" && (
              <div className="space-y-4">
                <input
                  placeholder="投票問題"
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
                />
                <div className="space-y-2">
                  {pollOptions.map((o, i) => (
                    <input
                      key={i}
                      value={o}
                      onChange={(e) =>
                        setPollOptions(pollOptions.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      placeholder={`選項 ${i + 1}`}
                      className="w-full px-4 py-2.5 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
                    />
                  ))}
                  <button
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-sm text-terracotta hover:underline"
                  >
                    + 新增選項
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2 text-ink/70">
                    <input type="checkbox" className="rounded text-terracotta" />
                    允許多選
                  </label>
                  <label className="flex items-center gap-2 text-ink/70">
                    截止時間
                    <input type="date" className="px-2 py-1 rounded border border-sand text-xs" />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-sand flex items-center gap-3">
              <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
                發布
              </button>
              <button className="px-4 py-2.5 rounded-soft text-ink/70 hover:bg-cream/50">儲存草稿</button>
              <span className="ml-auto text-xs text-ink/40">公開給所有家人</span>
            </div>
          </section>

          {/* Preview */}
          <section>
            <div className="text-xs text-ink/50 mb-2 font-medium tracking-wider">即時預覽</div>
            <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
              {tab === "post" && (
                <>
                  <div className="flex items-center gap-2 mb-3 text-sm text-ink/60">
                    <div className="w-8 h-8 rounded-full bg-sage" />
                    <span>媽媽 · 剛剛</span>
                  </div>
                  {title ? <h3 className="serif text-xl text-ink mb-2">{title}</h3> : null}
                  <p className="text-ink/75 leading-relaxed">{body || "（預覽會出現在這裡...）"}</p>
                </>
              )}
              {tab === "activity" && (
                <div>
                  <div className="h-32 rounded-soft mb-3" style={{ background: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)" }} />
                  <h3 className="serif text-xl text-ink mb-1">（活動標題會出現在這裡）</h3>
                  <div className="text-sm text-ink/60">📍 地點 · 🗓 時間</div>
                </div>
              )}
              {tab === "poll" && (
                <div>
                  <div className="text-xs text-sage-dark mb-2">📊 投票</div>
                  <h3 className="serif text-lg text-ink mb-3">（投票問題會出現在這裡）</h3>
                  <div className="space-y-2">
                    {pollOptions.map((o, i) => (
                      <div key={i} className="px-4 py-2 rounded-soft bg-cream/40 border border-sand text-sm text-ink/70">
                        {o || `選項 ${i + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
