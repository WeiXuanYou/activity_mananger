/**
 * LLM client — the ONLY place in the app that talks to the Anthropic SDK.
 * A provider swap or model change touches this one file.
 *
 * Behavior:
 *   - If ANTHROPIC_API_KEY is set → real Claude call (Phase G live mode)
 *   - If not set                  → deterministic stub (so the app still
 *                                    runs in dev/CI without a key)
 *
 * Model choice by tier:
 *   - "fast"  → claude-haiku-4-5  (cheap/quick: classification, short rewrites)
 *   - "smart" → claude-opus-4-8   (drafting, reasoning) with adaptive thinking
 *
 * Caching: the system prompt is sent as a cache_control block so that once
 * prompts grow past the cacheable minimum, repeated calls with the same
 * system prefix are billed at the cache-read rate. (Our current prompts are
 * short, so caching is a no-op until they grow — the marker is harmless.)
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type LLMRequest = {
  system: string;
  user: string;
  /** Picks the model + thinking/effort profile. */
  tier?: "fast" | "smart";
};

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callLLM(req: LLMRequest): Promise<string> {
  const client = getClient();

  // Dev / CI fallback — no key configured. Keep the UI working with a
  // clearly-labelled stub instead of throwing.
  if (!client) {
    return `[Stub · 未設定 ANTHROPIC_API_KEY · tier=${req.tier ?? "smart"}]\n${req.user.slice(0, 120)}...`;
  }

  const tier = req.tier ?? "smart";

  try {
    if (tier === "fast") {
      // Haiku: no thinking / effort params (unsupported on Haiku 4.5).
      const res = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: [
          { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
        ],
        messages: [{ role: "user", content: req.user }],
      });
      return firstText(res);
    }

    // Smart tier: Opus 4.8 with adaptive thinking + medium effort.
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [
        { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: req.user }],
    });
    return firstText(res);
  } catch (err) {
    // Surface a friendly message rather than crashing the action
    const msg = err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : String(err);
    // eslint-disable-next-line no-console
    console.error("[callLLM] failed", msg);
    return `[AI 暫時無法回應：${msg}]`;
  }
}

/** Extract the first text block from a Messages response. */
function firstText(res: Anthropic.Message): string {
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}
