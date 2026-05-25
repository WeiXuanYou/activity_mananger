import type { Suggestion } from "./types";

/** Suggestion presets shown on composer surfaces. */
export const COMPOSER_SUGGESTIONS: Record<string, Suggestion[]> = {
  "composer-post": [
    { id: "s1", capability: "classify",  label: "幫我建議分類",      hint: "讀內容後給 1-3 個分類", emoji: "🏷" },
    { id: "s2", capability: "rewrite",   label: "讓語氣更溫暖",      hint: "改寫成更家常的口吻",   emoji: "💛" },
    { id: "s3", capability: "summarize", label: "幫我寫摘要",        hint: "讀完整段給一句總結",   emoji: "📜" },
  ],
  "composer-activity": [
    { id: "s4", capability: "draft-activity", label: "從一句話擴寫活動", hint: "「外婆生日」→ 完整描述", emoji: "✨" },
    { id: "s5", capability: "find-time",      label: "找大家方便的時間", hint: "依過往 RSVP 推薦",    emoji: "📅" },
    { id: "s6", capability: "classify",       label: "建議分類",          hint: "",                       emoji: "🏷" },
  ],
  "composer-poll": [
    { id: "s7", capability: "draft-poll",         label: "從問題擴寫選項",   hint: "「下次吃什麼？」→ 5 個選項", emoji: "✨" },
    { id: "s8", capability: "recommend-options",  label: "依大家口味推薦",   hint: "讀歷史投票偏好",          emoji: "🍱" },
  ],
};

/** Big capability menu for the dedicated /mockup/assistant page. */
export const CAPABILITY_MENU: Suggestion[] = [
  { id: "m1", capability: "draft-activity",   label: "草擬一場活動",     hint: "把腦中模糊的想法變成完整草稿", emoji: "🍖" },
  { id: "m2", capability: "draft-poll",       label: "起一個投票",        hint: "我給問題、它給選項",            emoji: "📊" },
  { id: "m3", capability: "classify",         label: "幫內容分類",        hint: "貼一段文字，它建議標籤",        emoji: "🏷" },
  { id: "m4", capability: "summarize",        label: "摘要長文",          hint: "外公的長文一鍵摘要",            emoji: "📜" },
  { id: "m5", capability: "rewrite",          label: "改寫語氣",          hint: "更正式 / 更家常 / 更幽默",      emoji: "💛" },
  { id: "m6", capability: "translate",        label: "翻譯",              hint: "海外親友看得懂",                emoji: "🌐" },
  { id: "m7", capability: "find-time",        label: "找大家可以的時間",   hint: "依歷史 RSVP 比對",              emoji: "📅" },
  { id: "m8", capability: "recommend-options",label: "推薦選項",          hint: "依大家偏好給投票選項",          emoji: "🍱" },
];
