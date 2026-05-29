# modules/ai-assistant

AI 助手模組——**目前是 stub 骨架**，等待後續接入 Anthropic SDK。

## 用途

提供智能輔助，幫家人朋友更輕鬆使用「相聚」：

- 📝 **草擬內容**——「幫我寫一篇關於外婆生日的文章」
- 🏷 **自動分類**——讀文章 / 活動 → 建議該打哪些 category
- 📅 **建議聚會時間**——根據家人歷史可用性建議
- 📊 **建議投票選項**——「下次吃什麼？」→ 給出符合大家口味的選項
- 📜 **摘要**——長文章 / 長串留言一鍵摘要
- 💡 **回顧推薦**——「我們上次旅遊去哪了？」

## 檔案結構（與其他 module 一致）

```
modules/ai-assistant/
  index.ts              公開 API barrel
  types.ts              Suggestion / AssistantTurn / Capability 等型別
  client.ts             ↞ stub LLM client，未來換成真實 Anthropic SDK 呼叫
  data.ts               範例 prompt suggestions（給 UI 顯示）
  queries.ts            高階函式：suggestCategories(), summarize(), draftActivity()
  prompts/              可重用 prompt templates
    classify.ts
    summarize.ts
    draft-activity.ts
    draft-poll.ts
  components/
    AssistantSuggestions.tsx   composer 內嵌的「✨ 試試 AI」chip 列
    AssistantPanel.tsx         側邊抽屜面板
    SuggestionCard.tsx         單一建議卡
```

## 接入真實 LLM 的步驟（未來 Phase G）

1. `npm install @anthropic-ai/sdk`
2. 替換 `modules/ai-assistant/client.ts`：
   ```ts
   import Anthropic from "@anthropic-ai/sdk";
   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

   export async function callLLM(systemPrompt: string, userMessage: string) {
     const result = await client.messages.create({
       model: "claude-sonnet-4-6",          // or opus
       max_tokens: 1024,
       system: systemPrompt,
       messages: [{ role: "user", content: userMessage }],
     });
     return result.content[0].type === "text" ? result.content[0].text : "";
   }
   ```
3. 啟用 prompt caching（system prompt 是固定的，可大幅省 token）：
   ```ts
   system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }]
   ```
4. 將 `queries.ts` 內的 stub 換成呼叫 `callLLM`。
5. 加上 rate-limit、error handling、模型選擇（Opus / Sonnet / Haiku）。

## 模組依賴規則

- AI assistant **可以讀** `core/*`（為了組 context：成員、歷史活動、文章內容）
- AI assistant **不應寫入** `core/*`——它只 **建議**；真正建立內容仍走原本的 server action + `requirePermission`
- 不應依賴 `analytics`（避免循環）

## Phase 進度

- ✅ Phase A: 骨架建立
- ✅ **Phase G**: `client.ts` 已接 `@anthropic-ai/sdk`
  - 有 `ANTHROPIC_API_KEY` → Claude Opus 4.8（smart tier，adaptive thinking + medium effort）或 Haiku 4.5（fast tier，分類/摘要）
  - 無 key → deterministic stub，UI 照常運作
  - system prompt 帶 `cache_control`（prompt 變長後自動受益於 prompt caching）
  - `queries.ts` 會 parse LLM 的 JSON 回應，失敗自動 fallback 到 heuristic
  - `/app/assistant` 即時 playground；`actions.ts` 是 server actions（需登入，但不需特殊權限——AI 只建議不寫入）

## ⚠️ Server-only 邊界

`client.ts` 用 `import "server-only"` + `@anthropic-ai/sdk`（Node-only）。
**client component 不可 import `@/modules/ai-assistant` barrel**，否則 SDK 會被打包進瀏覽器 bundle 導致 build 失敗。
client component 要用 UI 元件時，從窄路徑引：
`@/modules/ai-assistant/components/AssistantSuggestions`、`@/modules/ai-assistant/data`。

## 接真實 LLM（已完成，僅需 key）

設 `ANTHROPIC_API_KEY` 環境變數並重啟即可。模型字串、adaptive thinking、effort、
prompt caching 全部已在 `client.ts` 設好——不用改任何程式碼。
