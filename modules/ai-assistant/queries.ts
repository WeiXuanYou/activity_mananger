import { listCategories } from "@/modules/core/categories";
import type { Category } from "@/modules/core/categories";
import { callLLM, isLLMConfigured } from "./client";
import { SYSTEM_CLASSIFY, buildClassifyUserPrompt } from "./prompts/classify";
import { SYSTEM_SUMMARIZE, buildSummarizeUserPrompt } from "./prompts/summarize";
import { SYSTEM_DRAFT_ACTIVITY, buildDraftActivityPrompt } from "./prompts/draft-activity";
import { SYSTEM_DRAFT_POLL, buildDraftPollPrompt } from "./prompts/draft-poll";
import type { ClassifySuggestion, DraftActivityResult } from "./types";

/**
 * High-level helpers. Pages call these — never `callLLM` directly — so
 * prompt wording and JSON parsing live in one place.
 *
 * Each function follows the same shape:
 *   - When a key is configured, call Claude and parse its JSON reply.
 *   - When it isn't (dev/CI), fall back to a deterministic heuristic so
 *     the UI still demos sensibly.
 *   - If the LLM reply doesn't parse, fall back too (never throw at the UI).
 */

/** Pull a JSON object out of an LLM reply that may wrap it in prose/fences. */
function parseJsonReply<T>(raw: string): T | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function suggestCategories(text: string): Promise<ClassifySuggestion> {
  const cats: Category[] = listCategories();
  if (!text.trim()) return { categoryIds: [], reason: "（空白內容）" };

  if (isLLMConfigured()) {
    const raw = await callLLM({
      system: SYSTEM_CLASSIFY,
      user: buildClassifyUserPrompt(text, cats),
      tier: "fast",
    });
    const parsed = parseJsonReply<{ categoryIds?: string[]; reason?: string }>(raw);
    if (parsed?.categoryIds) {
      // Keep only IDs that actually exist (model could hallucinate)
      const valid = parsed.categoryIds.filter((id) => cats.some((c) => c.id === id));
      return { categoryIds: valid.slice(0, 3), reason: parsed.reason ?? "AI 建議" };
    }
  }

  return stubKeywordMatch(text, cats);
}

export async function summarize(content: string): Promise<string> {
  if (content.length < 60) return content;
  if (isLLMConfigured()) {
    const out = await callLLM({
      system: SYSTEM_SUMMARIZE,
      user: buildSummarizeUserPrompt(content),
      tier: "fast",
    });
    if (out.trim()) return out.trim();
  }
  return content.slice(0, 50) + "...（摘要 stub · 未接 LLM）";
}

export async function draftActivity(idea: string): Promise<DraftActivityResult> {
  if (isLLMConfigured()) {
    const raw = await callLLM({
      system: SYSTEM_DRAFT_ACTIVITY,
      user: buildDraftActivityPrompt(idea),
      tier: "smart",
    });
    const parsed = parseJsonReply<DraftActivityResult>(raw);
    if (parsed?.title) return parsed;
  }
  return {
    title: idea.slice(0, 24),
    description: `（stub · 未接 LLM）依據你的想法「${idea}」，建議我們...`,
    suggestedCategoryIds: ["c-family"],
    suggestedDate: undefined,
  };
}

export async function draftPoll(idea: string): Promise<{ question: string; options: string[] }> {
  if (isLLMConfigured()) {
    const raw = await callLLM({
      system: SYSTEM_DRAFT_POLL,
      user: buildDraftPollPrompt(idea),
      tier: "smart",
    });
    const parsed = parseJsonReply<{ question?: string; options?: string[] }>(raw);
    if (parsed?.question && parsed.options?.length) {
      return { question: parsed.question, options: parsed.options };
    }
  }
  return {
    question: idea.endsWith("？") ? idea : `${idea}？`,
    options: ["選項 A（stub）", "選項 B", "選項 C"],
  };
}

/** Heuristic fallback so the demo isn't empty without an API key. */
function stubKeywordMatch(text: string, cats: Category[]): ClassifySuggestion {
  const t = text.toLowerCase();
  const rules: { kw: string[]; slug: string }[] = [
    { kw: ["吃", "餐", "食", "菜", "烤肉", "聚餐", "食譜"], slug: "food" },
    { kw: ["旅", "行", "出遊", "trip", "京都", "墾丁"], slug: "travel" },
    { kw: ["家", "媽", "爸", "阿嬤", "外公"], slug: "family" },
    { kw: ["朋友", "同學", "andy"], slug: "friends" },
    { kw: ["生日", "禮物", "驚喜"], slug: "gift" },
    { kw: ["山", "跑", "健身", "健康", "瑜珈"], slug: "health" },
    { kw: ["推薦", "好用", "好喝"], slug: "recommend" },
  ];
  const hitSlugs = new Set<string>();
  for (const r of rules) if (r.kw.some((k) => t.includes(k))) hitSlugs.add(r.slug);

  const matched = cats.filter((c) => hitSlugs.has(c.slug));
  return {
    categoryIds: matched.slice(0, 3).map((c) => c.id),
    reason: matched.length
      ? `根據關鍵字「${[...hitSlugs].join("、")}」推薦（未接 LLM）`
      : "（找不到明顯關鍵字 · 設定 ANTHROPIC_API_KEY 後會用 Claude 精準分類）",
  };
}
