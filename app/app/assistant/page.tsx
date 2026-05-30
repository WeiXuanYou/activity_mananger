import { requireCurrentUser } from "@/modules/auth";
import { isLLMConfigured, describeProvider } from "@/modules/ai-assistant";
import { AssistantPlayground } from "./AssistantPlayground";

/**
 * Live AI assistant page (Phase G/I). The playground calls server actions
 * that go through `modules/ai-assistant/client.ts`, which dispatches to
 * either the Anthropic SDK or any OpenAI-compatible endpoint (Ollama,
 * LM Studio, vLLM, official OpenAI...) based on LLM_PROVIDER.
 */
export default async function AppAssistantPage() {
  const me = await requireCurrentUser();
  const live = isLLMConfigured();
  const providerLabel = describeProvider();

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
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
          title={providerLabel}
        >
          {live ? `● ${providerLabel}` : `○ Stub · ${providerLabel}`}
        </span>
      </div>

      {!live && (
        <div className="mt-4 mb-6 bg-cream/50 rounded-soft border border-sand p-4 text-sm text-ink/70 leading-relaxed">
          目前是 <strong>stub 模式</strong>——下方功能可用，但回應由本地 heuristic 產生。
          要切到真實 LLM：
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>
              <strong>Anthropic Claude</strong>：設 <code className="text-terracotta">ANTHROPIC_API_KEY</code>（預設 provider）
            </li>
            <li>
              <strong>本地 Ollama / LM Studio / vLLM</strong>：設{" "}
              <code className="text-terracotta">LLM_PROVIDER=openai</code>，
              <code className="text-terracotta">LLM_BASE_URL=http://localhost:11434/v1</code>，
              <code className="text-terracotta">LLM_MODEL_SMART=qwen2.5:14b</code>
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink/55">
            程式碼一行不用改——全部封裝在 <code className="text-terracotta">modules/ai-assistant/client.ts</code>。
          </p>
        </div>
      )}

      <AssistantPlayground live={live} providerLabel={providerLabel} />

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">設計原則：</strong>
        AI 只「建議」，不直接寫入資料。要把建議變成真的投票/文章，仍走原本
        過 <code className="text-terracotta">requirePermission()</code> 的 server actions——
        所以 AI 不會繞過權限。
      </div>
    </main>
  );
}
