# 相聚 · Together

封閉式家人/朋友活動管理 + 社群平台。
**Phase A** 視覺原型 + **Phase B** 認證 + Prisma + 真實權限。

> 新成員 / AI 助手請先讀 [`AGENTS.md`](./AGENTS.md) —— 架構地圖與貢獻原則。

## 啟動

```bash
# 1. 安裝依賴
npm install

# 2. 複製環境變數
cp .env.example .env

# 3. 初始化資料庫並 seed
npm run db:push      # 建 SQLite schema
npm run db:seed      # 灌入示範資料 + demo 邀請碼

# 4. 啟動
npm run dev
```

打開 http://localhost:3000：
- **首頁**：兩條入口（真實登入 / 看 Mockup）
- **`/login`**：真實邀請碼登入（demo codes 列在頁面上）
- **`/app/feed`**：真實 Prisma 查詢的 feed（需登入）
- **`/mockup/*`**：12 個視覺原型頁，用 mock data

## Demo 邀請碼（seed 內建）
| 邀請碼 | 角色 |
|---|---|
| `TOGETHER-DEMO-MEMBER` | Member |
| `TOGETHER-DEMO-EDITOR` | Editor |
| `TOGETHER-DEMO-GUEST`  | Guest |

## 目錄結構

```
app/
  page.tsx           Landing
  login/             真實登入頁（server action）
  app/               真實認證後的應用（middleware 保護）
    layout.tsx       Session 守衛
    feed/            真實 DB 查詢的 feed
  mockup/            視覺原型（mock data，不需登入）
    layout.tsx       套用 FAB + 行動版底部 nav

modules/             業務邏輯模組（每個都遵守相同結構）
  auth/              邀請碼、cookie session、登入 action
  permissions/       角色矩陣 + requirePermission() 真實檢查
  core/              社群核心
    members/         成員 + 頭像 + getMockCurrentUser
    categories/      分類（預設 + 自訂）+ 篩選列、選擇器
    activities/      活動 + RSVP + 日期 helpers
    posts/           文章/推薦/置頂
    polls/           Line 風格投票
    feed/            混合時間軸
  custom-pages/      CMS（block-renderer registry）
  analytics/         分析模組（隔離，單向消費事件）
  ai-assistant/      ✨ AI 助手骨架（stub → Phase G 接 Anthropic SDK）

lib/
  db.ts              Prisma client singleton
  date.ts            日期格式化

prisma/
  schema.prisma      完整 schema
  seed.ts            示範資料 + demo 邀請碼

middleware.ts        Edge 中介層：/app/* 沒 session 重導 /login
```

## 三大模組規則
1. `core` 永遠不引入 `analytics`，只透過 `analytics.emit()` 單向通知
2. `analytics` 不 JOIN `core` 表，只讀 `AnalyticsEvent`
3. 所有 mutation 都先過 `requirePermission()`

詳見 [`AGENTS.md`](./AGENTS.md)。

## 工作指令
```bash
npm run dev          # Next.js dev server
npm run build        # 生產建置
npm run db:push      # schema → DB
npm run db:seed      # 重新灌示範資料
npm run db:studio    # 開 Prisma Studio
```

## Phase 進度
- ✅ **Phase A** 視覺原型
- ✅ **Phase B** 認證 + Prisma + 真實 requirePermission
- ✅ **Phase C** Social core 真接 DB：feed / activity / poll / posts / permissions
- ✅ **Phase D** CMS 區塊渲染器：richtext / markdown / html / image / embed-poll；`/app/pages` + `/app/pages/[slug]` + `/app/pages/new` 真實建立
- ✅ **Phase E** 分析事件流：`emit()` 寫 `AnalyticsEvent`；`/app/analytics` gated by `analytics.view`，即時事件流
- ⬜ **Phase F** 通知 / 邀請碼產生 UI
- ⬜ **Phase G** AI 助手接 Anthropic SDK（骨架已備好）
