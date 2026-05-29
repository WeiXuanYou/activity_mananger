"use server";
/**
 * Server actions exposing the AI assistant to the UI. These run the
 * high-level helpers (which call Claude when a key is set, else stub).
 *
 * No `requirePermission` here: the assistant only *suggests*; it never
 * writes to core tables. Acting on a suggestion (creating the poll,
 * applying the categories) still goes through the normal permission-gated
 * server actions. We do require a signed-in user so usage is attributable.
 */
import { requireCurrentUser } from "@/modules/auth";
import { findCategoriesByIds } from "@/modules/core/categories";
import { suggestCategories, summarize, draftPoll, draftActivity } from "./queries";

export type AssistantResult = {
  ok: boolean;
  kind: "classify" | "summarize" | "draft-poll" | "draft-activity";
  text: string;
};

export async function runClassifyAction(text: string): Promise<AssistantResult> {
  await requireCurrentUser();
  const { categoryIds, reason } = await suggestCategories(text);
  const names = findCategoriesByIds(categoryIds).map((c) => `${c.emoji} ${c.name}`);
  const text_ =
    names.length > 0
      ? `建議分類：${names.join("、")}\n理由：${reason}`
      : `沒有明確分類建議。${reason}`;
  return { ok: true, kind: "classify", text: text_ };
}

export async function runSummarizeAction(text: string): Promise<AssistantResult> {
  await requireCurrentUser();
  const summary = await summarize(text);
  return { ok: true, kind: "summarize", text: summary };
}

export async function runDraftPollAction(idea: string): Promise<AssistantResult> {
  await requireCurrentUser();
  const { question, options } = await draftPoll(idea);
  const text = `問題：${question}\n選項：\n${options.map((o, i) => `  ${i + 1}. ${o}`).join("\n")}`;
  return { ok: true, kind: "draft-poll", text };
}

export async function runDraftActivityAction(idea: string): Promise<AssistantResult> {
  await requireCurrentUser();
  const d = await draftActivity(idea);
  const cats = findCategoriesByIds(d.suggestedCategoryIds).map((c) => `${c.emoji} ${c.name}`);
  const text = [
    `標題：${d.title}`,
    `描述：${d.description}`,
    cats.length ? `建議分類：${cats.join("、")}` : null,
    d.suggestedDate ? `建議日期：${d.suggestedDate}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return { ok: true, kind: "draft-activity", text };
}
