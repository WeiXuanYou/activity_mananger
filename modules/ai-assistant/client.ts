/**
 * LLM client — STUB.
 *
 * Phase A: returns canned responses so the UI can render.
 * Phase G: replace body with real Anthropic SDK call.
 *
 * Keep this file as the ONLY place that knows about the LLM provider,
 * so a future provider swap touches one file.
 */

export type LLMRequest = {
  system: string;
  user: string;
  /** Hint for which model to pick; mapped in Phase G */
  tier?: "fast" | "smart";
};

export async function callLLM(req: LLMRequest): Promise<string> {
  // PHASE G TODO: replace with @anthropic-ai/sdk call.
  // Example shape:
  //
  //   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  //   const model = req.tier === "fast" ? "claude-haiku-4-5" : "claude-sonnet-4-6";
  //   const res = await client.messages.create({
  //     model,
  //     max_tokens: 1024,
  //     system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
  //     messages: [{ role: "user", content: req.user }],
  //   });
  //   return res.content[0].type === "text" ? res.content[0].text : "";

  return `[Stub LLM response · ${req.tier ?? "smart"}]\n${req.user.slice(0, 80)}...`;
}

export function isLLMConfigured(): boolean {
  // Phase G: return Boolean(process.env.ANTHROPIC_API_KEY)
  return false;
}
