import type { Category } from "@/modules/core/categories";

export const SYSTEM_CLASSIFY = `你是「相聚」這個小型家庭/朋友社群的 AI 助手。
任務：讀使用者寫的內容，從給定的分類清單裡推薦最相關的 1-3 個分類 ID。

回傳 JSON：{ "categoryIds": ["c-food", ...], "reason": "簡短理由" }
語氣：溫暖、簡潔。台灣中文。`;

export function buildClassifyUserPrompt(text: string, categories: Category[]) {
  const list = categories
    .map((c) => `- ${c.id}: ${c.emoji} ${c.name}${c.description ? ` (${c.description})` : ""}`)
    .join("\n");

  return `可用分類：
${list}

要分類的內容：
"""
${text}
"""`;
}
