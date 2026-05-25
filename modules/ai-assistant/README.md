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

- ✅ Phase A: 骨架建立（本檔案）
- ⬜ Phase G: 接入 Anthropic SDK + 真實對話
