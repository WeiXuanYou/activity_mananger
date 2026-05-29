import { requireCurrentUser } from "@/modules/auth";
import { isLLMConfigured } from "@/modules/ai-assistant";
import { AssistantPlayground } from "./AssistantPlayground";

/**
 * Live AI assistant page (Phase G). The playground calls real server
 * actions that hit Claude when ANTHROPIC_API_KEY is set, else a stub.
 */
export default async function AppAssistantPage() {
  const me = await requireCurrentUser();
  const live = isLLMConfigured();

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-end gap-4 mb-2">
        <div className="text-4xl">✨</div>
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">AI ASSISTANT</p>
          <h1 className="serif text-3xl text-ink">AI 小助手</h1>
          <p className="text-ink/60 text-sm mt-1">嗨 {me.name}，幫你草擬投票、自動分類、整理摘要。</p>
        </div>
        <span
          className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium ${
            live ? "bg-sage-soft text-sage-dark" : "bg-cream text-ink/55"
          }`}
        >
          {live ? "● Claude 已接入 (Opus 4.8)" : "○ Stub 模式（未設 API key）"}
        </span>
      </div>

      {!live && (
        <div className="mt-4 mb-6 bg-cream/50 rounded-soft border border-sand p-4 text-sm text-ink/70 leading-relaxed">
          目前是 <strong>stub 模式</strong>——下方功能可用，但回應由本地 heuristic 產生。
          設定環境變數 <code className="text-terracotta">ANTHROPIC_API_KEY</code> 後重啟，
          同樣的 UI 就會改用 <strong>Claude Opus 4.8</strong>（自動 adaptive thinking）真實回應，
          程式碼一行都不用改——全部封裝在 <code className="text-terracotta">modules/ai-assistant/client.ts</code>。
        </div>
      )}

      <AssistantPlayground live={live} />

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">設計原則：</strong>
        AI 只「建議」，不直接寫入資料。要把建議變成真的投票/文章，仍走原本
        過 <code className="text-terracotta">requirePermission()</code> 的 server actions——
        所以 AI 不會繞過權限。
      </div>
    </main>
  );
}
