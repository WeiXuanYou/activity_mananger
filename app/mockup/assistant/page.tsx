import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import {
  CAPABILITY_MENU,
  SuggestionCard,
  isLLMConfigured,
} from "@/modules/ai-assistant";

export default function AssistantMockup() {
  const llmReady = isLLMConfigured();

  return (
    <main>
      <MockNav active="/mockup/assistant" />
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-end gap-4 mb-2">
          <div className="text-5xl">✨</div>
          <div>
            <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">AI ASSISTANT · STUB</p>
            <h1 className="serif text-3xl text-ink">AI 小助手</h1>
            <p className="text-ink/60 text-sm mt-1">
              幫你草擬內容、自動分類、整理回顧——讓「相聚」變得更省心。
            </p>
          </div>
          <span
            className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium ${
              llmReady ? "bg-sage-soft text-sage-dark" : "bg-cream text-ink/55"
            }`}
          >
            {llmReady ? "● LLM 已接入" : "○ 尚未接入 Anthropic SDK"}
          </span>
        </div>

        <div className="mt-6 mb-8 bg-gradient-to-br from-sage-soft/40 via-cream to-terracotta-soft/30 rounded-soft border border-sage/20 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🌱</div>
            <div>
              <h2 className="serif text-lg text-ink mb-1">目前是 Phase A 骨架</h2>
              <p className="text-sm text-ink/70 leading-relaxed mb-2">
                所有按鈕已連接 <code className="text-terracotta">modules/ai-assistant/queries.ts</code>，
                目前用 <strong>keyword 規則</strong>產生 stub 回應。等 Phase G 接入 Anthropic SDK 後，
                同樣的 UI 就會回傳真實 LLM 結果——只需要改 <code className="text-terracotta">client.ts</code> 一個檔案。
              </p>
              <p className="text-xs text-ink/55">
                詳見 <code className="text-sage-dark">modules/ai-assistant/README.md</code>
              </p>
            </div>
          </div>
        </div>

        <h2 className="serif text-xl text-ink mb-4">能做什麼？</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {CAPABILITY_MENU.map((s) => <SuggestionCard key={s.id} suggestion={s} />)}
        </div>

        <h2 className="serif text-xl text-ink mb-4">範例對話（mock）</h2>
        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 space-y-4">
          <Bubble role="user">
            幫我寫個外婆 80 歲生日的活動，地點在外公家，日期六月底
          </Bubble>
          <Bubble role="assistant">
            好的 ☺️ 我擬了個草稿：<br />
            <strong>標題：</strong>外婆 80 大壽 🎂<br />
            <strong>日期：</strong>6/28（六）18:00<br />
            <strong>地點：</strong>外公家<br />
            <strong>描述：</strong>給外婆一個驚喜——大家提前 30 分鐘到場準備蛋糕和拉炮。
            阿姨負責訂餐，舅舅負責拍照。記得帶卡片來簽名！<br />
            <strong>建議分類：</strong>🏠 家事、🎁 禮物<br />
            <span className="text-xs text-ink/40 italic">[ Phase A 為 stub，Phase G 接 Anthropic SDK 後會更個人化 ]</span>
          </Bubble>
          <Bubble role="user">很棒，幫我同時起一個投票問大家要訂哪間蛋糕</Bubble>
          <Bubble role="assistant">
            投票草擬好了：<br />
            <strong>問題：</strong>外婆生日蛋糕要訂哪一家？🎂<br />
            <strong>選項：</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>東區法式蛋糕店（去年大家很喜歡）</li>
              <li>外婆愛的傳統紅豆奶油蛋糕</li>
              <li>低糖鮮果蛋糕（健康款）</li>
              <li>讓姑姑自己做</li>
            </ul>
            預設：單選、可新增選項、截止 6/26。
          </Bubble>
        </div>

        <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-5">
          <h3 className="serif text-base text-ink mb-2">🔌 接入步驟（給開發者）</h3>
          <ol className="text-sm text-ink/70 space-y-1 list-decimal list-inside">
            <li><code className="text-terracotta">npm install @anthropic-ai/sdk</code></li>
            <li>在 <code className="text-terracotta">.env</code> 加 <code>ANTHROPIC_API_KEY</code></li>
            <li>編輯 <code className="text-terracotta">modules/ai-assistant/client.ts</code>——只需動這個檔</li>
            <li>把 <code>callLLM</code> 內的 stub 換成真實 SDK 呼叫，啟用 prompt caching</li>
            <li>queries.ts 的高階函式自動受益，UI 不用改</li>
          </ol>
          <p className="text-xs text-ink/50 mt-2">完整說明見 <code className="text-sage-dark">modules/ai-assistant/README.md</code></p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/mockup" className="text-sm text-ink/50 hover:text-terracotta">← 回 Mockup 索引</Link>
        </p>
      </div>
    </main>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage to-sage-dark text-white text-sm flex items-center justify-center shrink-0">
          ✨
        </div>
      )}
      <div className={`rounded-soft p-3 max-w-[80%] text-sm leading-relaxed ${
        isUser ? "bg-terracotta text-white" : "bg-cream/60 text-ink/80"
      }`}>
        {children}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-sage text-white text-xs flex items-center justify-center shrink-0">
          媽
        </div>
      )}
    </div>
  );
}
