import { listCategories } from "@/modules/core/categories";
import type { Category } from "@/modules/core/categories";
import { callLLM } from "./client";
import { SYSTEM_CLASSIFY, buildClassifyUserPrompt } from "./prompts/classify";
import { SYSTEM_SUMMARIZE, buildSummarizeUserPrompt } from "./prompts/summarize";
import { SYSTEM_DRAFT_ACTIVITY, buildDraftActivityPrompt } from "./prompts/draft-activity";
import { SYSTEM_DRAFT_POLL, buildDraftPollPrompt } from "./prompts/draft-poll";
import type { ClassifySuggestion, DraftActivityResult } from "./types";

/**
 * High-level helpers. The page calls these — never callLLM directly,
 * so prompt changes happen in one place.
 */

export async function suggestCategories(text: string): Promise<ClassifySuggestion> {
  const cats: Category[] = listCategories();
  if (!text.trim()) {
    return { categoryIds: [], reason: "（空白內容）" };
  }
  // Phase A stub: naive keyword match so the UI shows something useful
  const guesses = stubKeywordMatch(text, cats);
  // Phase G:
  // const raw = await callLLM({
  //   system: SYSTEM_CLASSIFY,
  //   user: buildClassifyUserPrompt(text, cats),
  //   tier: "fast",
  // });
  // return JSON.parse(raw) as ClassifySuggestion;
  await callLLM({ system: SYSTEM_CLASSIFY, user: buildClassifyUserPrompt(text, cats), tier: "fast" });
  return guesses;
}

export async function summarize(content: string): Promise<string> {
  if (content.length < 60) return content;
  await callLLM({ system: SYSTEM_SUMMARIZE, user: buildSummarizeUserPrompt(content), tier: "fast" });
  return content.slice(0, 50) + "...（AI 摘要 stub）";
}

export async function draftActivity(idea: string): Promise<DraftActivityResult> {
  await callLLM({ system: SYSTEM_DRAFT_ACTIVITY, user: buildDraftActivityPrompt(idea), tier: "smart" });
  return {
    title: idea.slice(0, 24),
    description: `（AI stub）依據你的想法「${idea}」，建議我們...`,
    suggestedCategoryIds: ["c-family"],
    suggestedDate: undefined,
  };
}

export async function draftPoll(idea: string): Promise<{ question: string; options: string[] }> {
  await callLLM({ system: SYSTEM_DRAFT_POLL, user: buildDraftPollPrompt(idea), tier: "smart" });
  return {
    question: idea.endsWith("？") ? idea : `${idea}？`,
    options: ["選項 A（AI stub）", "選項 B", "選項 C"],
  };
}

/** Phase A heuristic so the demo isn't completely empty. */
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
      ? `根據關鍵字「${[...hitSlugs].join("、")}」推薦`
      : "（暫時找不到明顯關鍵字 · 真實 LLM 接入後會更精準）",
  };
}
