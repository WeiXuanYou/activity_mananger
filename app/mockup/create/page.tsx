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
  const [pollQuestion, setPollQuestion] = useState("");
  const [multiSelect, setMultiSelect] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [allowAdd, setAllowAdd] = useState(true);
  const [deadline, setDeadline] = useState<"1d" | "3d" | "1w" | "custom">("3d");
  const [pinAfterPost, setPinAfterPost] = useState(false);

  return (
    <main>
      <MockNav active="/mockup/create" />
      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-end gap-3 mb-2">
          <div>
            <h1 className="serif text-3xl text-ink">建立內容</h1>
            <p className="text-ink/60 text-sm">分享給家人和朋友 · 一切都是公開的（家圈內）</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 mt-5 bg-cream/50 p-1 rounded-soft inline-flex">
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
                  <button className="px-3 py-1.5 rounded-soft bg-cream/50 hover:bg-cream">📊 嵌入投票</button>
                </div>

                <label
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-soft border transition cursor-pointer ${
                    pinAfterPost
                      ? "bg-terracotta-soft/30 border-terracotta/40"
                      : "bg-cream/30 border-sand"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pinAfterPost}
                    onChange={(e) => setPinAfterPost(e.target.checked)}
                    className="mt-1 rounded text-terracotta"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">📌 發布後置頂於 Feed 最上方</div>
                    <div className="text-xs text-ink/55 mt-0.5">
                      需要 <strong>Editor</strong> 權限。所有家人首頁都會優先看到。
                    </div>
                  </div>
                </label>
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
                <div className="text-xs text-ink/55 bg-terracotta-soft/30 px-3 py-2 rounded-soft border border-terracotta/20">
                  💡 「建立活動」需要 <strong>Editor</strong> 權限。你目前是 Member ——
                  <Link href="/mockup/permissions" className="text-terracotta hover:underline ml-1">
                    申請更高權限
                  </Link>
                </div>
              </div>
            )}

            {tab === "poll" && (
              <div className="space-y-4">
                {/* Line-style intro */}
                <div className="bg-gradient-to-r from-sage-soft/40 to-cream rounded-soft border border-sage/20 p-3 text-xs text-ink/65 flex items-start gap-2">
                  <span className="text-lg">📊</span>
                  <span>
                    類似 Line 的投票工具——支援單選/多選、匿名、可由家人新增選項、自動截止。
                  </span>
                </div>

                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="想問家人什麼？（例：下次聚餐吃什麼？）"
                  className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
                />

                <div>
                  <div className="text-xs text-ink/60 font-medium mb-2">選項</div>
                  <div className="space-y-2">
                    {pollOptions.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-ink/40 text-sm w-5">{i + 1}.</span>
                        <input
                          value={o}
                          onChange={(e) =>
                            setPollOptions(pollOptions.map((x, j) => (j === i ? e.target.value : x)))
                          }
                          placeholder={`選項 ${i + 1}`}
                          className="flex-1 px-4 py-2.5 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                            className="text-ink/40 hover:text-terracotta text-sm w-7"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-sm text-terracotta hover:underline ml-7"
                    >
                      ＋ 新增選項
                    </button>
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <div className="text-xs text-ink/60 font-medium mb-2">⏰ 截止時間</div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["1d", "1 天後"],
                      ["3d", "3 天後"],
                      ["1w", "1 週後"],
                      ["custom", "自訂日期"],
                    ] as [typeof deadline, string][]).map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setDeadline(k)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          deadline === k
                            ? "bg-terracotta text-white shadow-card"
                            : "bg-cream/50 text-ink/70 hover:bg-cream"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {deadline === "custom" && (
                    <input
                      type="datetime-local"
                      className="mt-2 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm"
                    />
                  )}
                </div>

                {/* Options toggles */}
                <div className="space-y-2 pt-2 border-t border-sand">
                  <ToggleRow
                    label="允許多選"
                    desc="家人可以勾選多個選項"
                    on={multiSelect}
                    onChange={setMultiSelect}
                  />
                  <ToggleRow
                    label="🕶 匿名投票"
                    desc="不公開誰投了什麼，只看到票數"
                    on={anonymous}
                    onChange={setAnonymous}
                  />
                  <ToggleRow
                    label="允許家人新增選項"
                    desc="例如「素食組合」這種你沒想到的"
                    on={allowAdd}
                    onChange={setAllowAdd}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-sand flex flex-wrap items-center gap-3">
              <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
                {tab === "poll" ? "發起投票" : "發布"}
              </button>
              <button className="px-4 py-2.5 rounded-soft text-ink/70 hover:bg-cream/50">儲存草稿</button>
              <span className="ml-auto text-xs text-ink/40">公開給所有家人</span>
            </div>
          </section>

          {/* Preview */}
          <section>
            <div className="text-xs text-ink/50 mb-2 font-medium tracking-wider">即時預覽</div>
            <div
              className={`rounded-soft border p-5 ${
                pinAfterPost && tab === "post"
                  ? "bg-gradient-to-br from-terracotta-soft/30 to-cream shadow-soft border-terracotta/30"
                  : "bg-white shadow-card border-sand/60"
              }`}
            >
              {tab === "post" && (
                <>
                  {pinAfterPost && (
                    <div className="text-xs text-terracotta-dark font-medium mb-3">📌 將會置頂顯示</div>
                  )}
                  <div className="flex items-center gap-2 mb-3 text-sm text-ink/60">
                    <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white text-xs">媽</div>
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
                  <div className="h-1 bg-gradient-to-r from-sage to-terracotta opacity-60 -mx-5 -mt-5 mb-4 rounded-t" />
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-sage/15 text-sage-dark px-2 py-1 rounded-full font-medium">📊 投票</span>
                    {multiSelect && <span className="text-[10px] text-ink/60 bg-cream px-1.5 py-0.5 rounded">多選</span>}
                    {anonymous && <span className="text-[10px] text-ink/60 bg-cream px-1.5 py-0.5 rounded">🕶 匿名</span>}
                    <span className="text-xs text-terracotta-dark bg-terracotta-soft/50 px-2 py-1 rounded-full font-medium ml-auto">
                      ⏰ {{ "1d": "1 天後截止", "3d": "3 天後截止", "1w": "1 週後截止", custom: "自訂截止" }[deadline]}
                    </span>
                  </div>
                  <h3 className="serif text-lg text-ink mb-3">{pollQuestion || "（投票問題會出現在這裡）"}</h3>
                  <div className="space-y-2">
                    {pollOptions.map((o, i) => (
                      <div key={i} className="px-4 py-2.5 rounded-soft bg-cream/40 border border-sand text-sm text-ink/70 flex items-center gap-2">
                        <div className={`w-4 h-4 ${multiSelect ? "rounded" : "rounded-full"} border-2 border-sand bg-white`} />
                        <span>{o || `選項 ${i + 1}`}</span>
                      </div>
                    ))}
                    {allowAdd && (
                      <div className="px-4 py-2 rounded-soft border-2 border-dashed border-sand text-sm text-ink/40">
                        ＋ 家人可新增選項
                      </div>
                    )}
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

function ToggleRow({
  label, desc, on, onChange,
}: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer">
      <div className="flex-1">
        <div className="text-sm text-ink font-medium">{label}</div>
        <div className="text-xs text-ink/50">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`w-10 h-6 rounded-full transition relative ${on ? "bg-terracotta" : "bg-sand"}`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            on ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
