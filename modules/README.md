# modules/

所有業務邏輯、資料、與功能元件都住在這裡。`app/` 只放路由組合，不放邏輯。

## 模組總覽

```
modules/
├── auth/                 身份識別（邀請碼、cookie session）............... ✅ Phase B 上線
├── permissions/          角色矩陣 + requirePermission() 通道 ............... ✅ Phase B 上線
├── core/                 社群核心
│   ├── members/          成員 + 頭像 ........................................ ✅ Phase A
│   ├── categories/       分類（預設 + 自訂）+ URL-driven 篩選 ............... ✅ Phase A
│   ├── activities/       活動 + RSVP + 日期 helpers .......................... ✅ Phase A
│   ├── posts/            文章 / 推薦 / 隨筆 + 置頂 ............................ ✅ Phase A
│   ├── polls/            Line 風格投票 ...................................... ✅ Phase A
│   └── feed/             混合時間軸（組合模組） ............................. ✅ Phase A
├── custom-pages/         CMS 自訂頁面 + block renderer registry ............. ✅ Phase A
├── analytics/            事件流分析（單向，可獨立抽出） ..................... ✅ Phase A
└── ai-assistant/         AI 助手骨架（stub，待接 Anthropic SDK） ............. ⬜ Phase G
```

每個模組都有自己的 `README.md`，描述：
- 用途
- 公開 API
- 與其他模組的依賴關係
- 加新東西的食譜
- Phase 進度

## 模組合約

每個 module 遵守相同的檔案結構（**AI 助手與新成員可預期**）：

```
modules/<area>/<feature>/
├── index.ts        ← 公開 API barrel（頁面只能從這引）
├── README.md       ← 中文說明
├── types.ts        TypeScript 型別
├── data.ts         Mock seed data（Phase A）
├── queries.ts      純讀取函式（Phase C 後切換到 Prisma）
├── actions.ts      "use server" mutation actions（Phase B+ 才加）
└── components/     React 元件
```

## 三條紅線（**絕對不可違反**）

詳見 [/AGENTS.md](../AGENTS.md)。

1. **`core` 不引入 `analytics`**——只透過 `analytics.emit()` 單向通知
2. **`analytics` 不讀 `core` table**——只讀 `AnalyticsEvent`（防火牆）
3. **所有 mutation 必須先呼叫 `requirePermission()`**——安全模型的單一通道

## Mock vs Real（混合期）

| 環境 | 路徑 | 資料來源 | 認證 |
|---|---|---|---|
| Mockup | `/mockup/*` | module `data.ts`（同步） | `getMockCurrentUser()` |
| Real | `/app/*` | Prisma via `lib/db.ts`（async） | `getCurrentUser()` + middleware |

Phase C 會逐步把每個 module 的 `data.ts` 退役，由 Prisma 查詢取代——**頁面端的 imports 不會改**，這就是 module barrel + 統一型別的好處。

## 跨模組依賴圖

```
                  auth
                   │
                   ▼
              permissions  ◄── 每個 mutation 都過這
                   │
        ┌──────────┼──────────┬───────────┬──────────┐
        ▼          ▼          ▼           ▼          ▼
     members  categories  activities    posts      polls
        ▲          ▲          │           │          │
        └──────────┴──────────┴───────────┴──────────┘
                              │
                              ▼
                            feed (組合)
                              │
                              ▼
                       analytics.emit()  ──► AnalyticsEvent
                              ▲
                              │ (read-only)
                              └─── analytics dashboard

           custom-pages ─→ members, categories（同上）
           ai-assistant ─→ categories, members（讀 context；不 mutate）
```
