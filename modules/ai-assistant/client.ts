/**
 * LLM client — the ONLY place in the app that talks to an LLM provider.
 * A provider swap or model change touches this one file.
 *
 * Two providers supported, picked by `LLM_PROVIDER` env var:
 *
 *   1. "anthropic" (default) — Anthropic Claude API via official SDK
 *      Env:
 *        ANTHROPIC_API_KEY  required
 *        Models hard-coded: claude-haiku-4-5 / claude-opus-4-8
 *
 *   2. "openai" — Any OpenAI-compatible Chat Completions endpoint.
 *      Covers: official OpenAI, Ollama (localhost:11434/v1), LM Studio,
 *      vLLM, llama.cpp server, LocalAI, Groq, OpenRouter, …
 *      Env:
 *        LLM_BASE_URL       e.g. "http://localhost:11434/v1"  (Ollama default)
 *        LLM_API_KEY        any string for local servers; real key for hosted
 *        LLM_MODEL_FAST     e.g. "qwen2.5:7b"   (cheap/quick)
 *        LLM_MODEL_SMART    e.g. "qwen2.5:14b"  (better quality)
 *
 * Tiering: callers pass `tier: "fast" | "smart"` (default "smart") — they
 * don't pick the model. Swapping which model serves which tier is a one-line
 * env change in production.
 *
 * No config → deterministic stub so dev/CI keeps working without any key.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type LLMRequest = {
  system: string;
  user: string;
  /** Picks the model + thinking/effort profile. */
  tier?: "fast" | "smart";
};

type Provider = "anthropic" | "openai";

function getProvider(): Provider {
  const raw = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (raw === "openai" || raw === "ollama" || raw === "local") return "openai";
  return "anthropic";
}

/** True if the active provider has the env it needs to make a real call. */
export function isLLMConfigured(): boolean {
  const provider = getProvider();
  if (provider === "openai") return Boolean(process.env.LLM_BASE_URL);
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Human-readable label for status UI ("接 Anthropic" / "接 Ollama (本地)"). */
export function describeProvider(): string {
  const provider = getProvider();
  if (provider === "openai") {
    const url = process.env.LLM_BASE_URL ?? "(未設 LLM_BASE_URL)";
    const isLocal = /localhost|127\.0\.0\.1|\.local(\b|:)/.test(url);
    return isLocal ? `OpenAI-compatible (本地：${url})` : `OpenAI-compatible (${url})`;
  }
  return process.env.ANTHROPIC_API_KEY ? "Anthropic API" : "Anthropic API (未設 key)";
}

export async function callLLM(req: LLMRequest): Promise<string> {
  if (!isLLMConfigured()) {
    return `[Stub · LLM 未設定 · provider=${getProvider()} · tier=${req.tier ?? "smart"}]\n${req.user.slice(0, 120)}...`;
  }

  try {
    return getProvider() === "openai"
      ? await callOpenAICompatible(req)
      : await callAnthropic(req);
  } catch (err) {
    const msg =
      err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : String(err);
    // eslint-disable-next-line no-console
    console.error("[callLLM] failed", msg);
    return `[AI 暫時無法回應：${msg}]`;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Anthropic path
// ────────────────────────────────────────────────────────────────────────────

let cachedAnthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!cachedAnthropic) cachedAnthropic = new Anthropic();
  return cachedAnthropic;
}

async function callAnthropic(req: LLMRequest): Promise<string> {
  const client = getAnthropic();
  const tier = req.tier ?? "smart";

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
    return firstAnthropicText(res);
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
  return firstAnthropicText(res);
}

function firstAnthropicText(res: Anthropic.Message): string {
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

// ────────────────────────────────────────────────────────────────────────────
// OpenAI-compatible path (Ollama, LM Studio, vLLM, OpenAI, OpenRouter, ...)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Hand-rolled fetch against the Chat Completions endpoint — no SDK dep.
 * Every OpenAI-compatible server speaks this shape, so the same function
 * serves official OpenAI and any local server.
 */
async function callOpenAICompatible(req: LLMRequest): Promise<string> {
  const baseUrl = (process.env.LLM_BASE_URL ?? "").replace(/\/+$/, "");
  const apiKey = process.env.LLM_API_KEY ?? "ollama"; // dummy default for local
  const tier = req.tier ?? "smart";
  const model =
    tier === "fast"
      ? process.env.LLM_MODEL_FAST ?? process.env.LLM_MODEL_SMART ?? "gpt-4o-mini"
      : process.env.LLM_MODEL_SMART ?? process.env.LLM_MODEL_FAST ?? "gpt-4o";

  // 60s timeout — local models can take a while to first-token on cold load.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 60_000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: tier === "fast" ? 1024 : 2048,
        temperature: 0.7,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
      signal: ac.signal,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}: ${await res.text().catch(() => "")}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}
