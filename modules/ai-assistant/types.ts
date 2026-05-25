/**
 * Capabilities the assistant exposes. Add a new entry to extend the menu.
 * Phase A: stubs. Phase G: real LLM calls.
 */
export type AssistantCapability =
  | "classify"           // 建議分類
  | "summarize"          // 摘要長文
  | "draft-activity"    // 草擬活動
  | "draft-poll"         // 草擬投票
  | "recommend-options"  // 建議投票選項
  | "find-time"          // 找共同時間
  | "rewrite"            // 改寫文字（更溫暖 / 更簡潔）
  | "translate";         // 翻譯（家裡有海外親友時很有用）

export type Suggestion = {
  id: string;
  capability: AssistantCapability;
  label: string;
  hint: string;
  emoji: string;
};

export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AssistantContext = {
  /** Where the user is right now */
  surface: "feed" | "composer-post" | "composer-activity" | "composer-poll" | "page-detail";
  /** Free-form context the page passes in (e.g. current draft text) */
  draft?: string;
  /** IDs of related entities for grounding */
  relatedActivityIds?: string[];
  relatedPostIds?: string[];
};

export type ClassifySuggestion = {
  /** Category IDs the assistant recommends */
  categoryIds: string[];
  reason: string;
};

export type DraftActivityResult = {
  title: string;
  description: string;
  suggestedCategoryIds: string[];
  suggestedDate?: string;
};
