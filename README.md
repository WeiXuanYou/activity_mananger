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

# 3. 初始化資料庫並 seed（預設 = production-clean，只有 admin/admin）
npm run db:push      # 建 SQLite schema
npm run db:seed      # 預設為正式模式：只建一個 admin 帳號，沒有範例內容

# 如要灌入示範家人/活動/文章/住宿（給 /preview 截圖、demo 之用）：
SEED_MODE=demo npm run db:seed

# 4. 啟動
npm run dev
```

打開 http://localhost:3000：
- **首頁**：兩條入口（真實登入 / 看 Mockup）
- **`/login`**：用 handle + 密碼登入，或用邀請碼註冊。登入畫面**不**會印出帳號密碼或 demo 邀請碼——所有開發測試用憑證集中在這份 README。
- **`/app/feed`**：真實 Prisma 查詢的 feed（需登入）
- **`/mockup/*`**：12 個視覺原型頁，用 mock data

## 登入憑證（Demo / 開發用）

### 預設管理員（兩種 seed 模式都會建）
| handle | 密碼 |
|---|---|
| `admin` | `admin` |

> 第一次登入會強迫換密碼。**`npm run db:seed`（預設正式模式）只會建立 admin/admin 一個帳號，沒有任何範例內容（沒有阿嬤、沒有住宿、沒有文章），請登入後立即在 `/app/setup` 換掉密碼並建立邀請碼。`/mockup` 與 `/preview` 不依賴 DB，正式模式下這些視覺預覽照常運作。**

### Demo 邀請碼（僅 `SEED_MODE=demo` seed 會建立）
| 邀請碼 | 角色 |
|---|---|
| `TOGETHER-DEMO-MEMBER` | Member |
| `TOGETHER-DEMO-EDITOR` | Editor |
| `TOGETHER-DEMO-ADMIN`  | Admin |
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
  seed.ts            預設 = 只有 admin/admin；SEED_MODE=demo 灌入範例資料 + demo 邀請碼

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
npm run db:seed      # 正式 seed（admin/admin only）；前綴 SEED_MODE=demo 灌示範資料
npm run db:studio    # 開 Prisma Studio
```

## Phase 進度
- ✅ **Phase A** 視覺原型
- ✅ **Phase B** 認證 + Prisma + 真實 requirePermission
- ✅ **Phase C** Social core 真接 DB：feed / activity / poll / posts / permissions
- ✅ **Phase D** CMS 區塊渲染器：richtext / markdown / html / image / embed-poll；`/app/pages` + `/app/pages/[slug]` + `/app/pages/new` 真實建立
- ✅ **Phase E** 分析事件流：`emit()` 寫 `AnalyticsEvent`；`/app/analytics` gated by `analytics.view`，即時事件流
- ✅ **Phase F** 通知系統（`modules/notifications`、`notify()`、bell + `/app/notifications`）+ 管理工具（`/app/admin`：邀請碼產生、角色管理、審計日誌）
- ✅ **Phase G** AI 助手接 Anthropic SDK：`/app/assistant` 即時 playground；設 `ANTHROPIC_API_KEY` → Claude Opus 4.8，未設 → stub。AI 只建議不寫入，不繞過權限
- ✅ **Phase H** 社群迴路補完：留言（多型 `Comment`）、按讚（feed 真實接 `toggleLikeAction`）、`/app/activities/new` + `/app/polls/new` 建立表單、本地圖片上傳（`/public/uploads`）、`/app/calendar` 月曆檢視
