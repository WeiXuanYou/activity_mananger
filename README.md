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

## 帳戶 / 密碼找回

- 登入畫面有「忘記密碼或帳號？」連結，公開的 `/forgot` 頁面可同時：
  - 用 Email 重設密碼（信箱會收到 1 小時內有效的連結 → 自動登入）
  - 用 Email 找回登入帳號（handle）
- 登入後的 `/app/account`（header `⚙ 設定`）可改：頭像、名字、暱稱、Email、生日、密碼。
- 改密碼成功後，可用「🚪 把其他裝置登出」一次清掉其他所有 session。

### ⚠️ 資料持久化：「更新後資料不見」怎麼解（最重要）

**如果你發現每次更新 / 重新部署後，之前的操作（發文、刪除、改密碼）都不見了，幾乎一定是這兩個原因之一：**

**原因 A — 資料庫檔案放在「會被重建的」容器裡（最常見）**
SQLite 的 `dev.db` 如果放在容器內（例如 `./prisma/dev.db`），每次重新部署容器都是全新的、檔案是空的——**任何 script 都救不回來**。解法二選一：

- **SQLite + 持久化磁碟**：把 DB 放在重新部署也會保留的掛載磁碟上，例如
  ```bash
  DATABASE_URL="file:/data/together.db"   # /data 是掛載的持久化 volume，不是 repo 裡的路徑
  ```
- **改用 Postgres（推薦正式環境）**：DB 在容器外，重新部署完全不碰資料。見下方「從 SQLite 平移到 PostgreSQL」。

**原因 B — 啟動時跑了會洗資料的指令**
啟動指令**不能**用 `db:reset` / `prisma migrate reset`（那是開發專用、會砍掉重建）。

✅ **正確的啟動指令**：用內附的 `npm run start:prod`（= `scripts/start.sh`），它只做安全的事：
1. `prisma migrate deploy` —— 套用新 migration，**不刪任何資料**
2. `prisma db seed` —— **create-only**：只在沒有 admin 時建立，已存在就完全不碰（不會重設你改過的密碼 / 名字 / 內容）
3. 啟動 Next.js

> seed 現在是 create-only 的：重跑（每次部署）**不會**覆寫你的操作。已實測：改過密碼 + 發過文 + 設定完成的 admin，重跑 seed 後全部原封不動。

---

### 部署資料庫指令

正式環境一律用 **`npm run db:deploy`**（= `prisma migrate deploy`）— 它只**套用**未跑過的 migration，**不會刪資料**。

> ⚠️ **已經在跑舊版（Phase A–R）的自架使用者注意**
> 如果你的正式 DB 已經有資料、而且**從未跑過任何 migration**（之前是用 `prisma db push`），你需要先把第一個基準 migration 標記為「已套用」，再讓 Prisma 跑後續的 ALTER：
>
> ```bash
> # 一次性：告訴 Prisma 你的 DB 已經是基準狀態
> npx prisma migrate resolve --applied 20260531064910_init_with_email_and_password_reset
> # 然後正常套用後續 migration（加 email 欄位、PasswordReset 等）
> npm run db:deploy
> ```
>
> 全新安裝、或是空 DB 不需要這步。

`db:reset` 會砍掉重建並重新 seed —— **僅限開發機**。

### 寄信設定

| Env var | 用途 |
|---|---|
| `RESEND_API_KEY` | 不設 → 找回信件**只寫進 server log**（自架/開發可用，由管理員把連結貼給使用者）。設了 → 經 [Resend](https://resend.com) API 真的寄出。 |
| `MAIL_FROM` | 寄件人，預設 `相聚 Together <onboarding@resend.dev>`。⚠️ **預設這個 sandbox 寄件人只能寄到你註冊 Resend 用的那一個信箱**（其他收件人會收不到信、或進垃圾信，但 Resend 不會回報錯誤）。正式使用請務必：(1) 在 Resend 後台**驗證你的網域**，(2) 把這個變數改成 `名字 <noreply@your.domain>`。 |
| `APP_URL` | 用來組重設連結。預設讀 request 的 host header；佈署在反向代理後可手動設成 `https://your.domain`。 |
| `TRUST_PROXY` | 預設不信任 `X-Forwarded-For`（避免直連的客戶端偽造 IP 繞過登入限流）。**佈署在 Vercel / nginx / Caddy 等反向代理後請設成 `true`**，這樣每個 IP 才能正確區分。 |

## 為什麼用 SQLite？什麼時候該換 PostgreSQL？

預設用 **SQLite + Prisma**，原因：

- 自架版本一個指令就跑起來，不用另外架 DB server
- 備份 = 複製 `prisma/dev.db` 一個檔案
- 家人朋友規模（~100 人以內）連 SQLite 的 1% 都用不到
- Prisma 對 SQLite / Postgres 寫法一致，業務程式不用改

**什麼時候要換 Postgres**：
- 多實例佈署（Vercel serverless、Kubernetes、多台 VM）—— SQLite 是檔案鎖，多寫者會打架
- 同時上線使用者破 1000、有重度寫入（每秒數十次以上）
- 需要 read replica、PITR（point-in-time recovery）等企業級備援

### 從 SQLite 平移到 PostgreSQL

整個過程 ~15 分鐘。**本專案附了現成的 docker-compose、env 範本、JSON 匯出/匯入 script**，下面這份食譜整個跑過、有測過。

```bash
# ──── 0) 在新分支做（萬一搬一半要回頭）────
git checkout -b switch-to-postgres

# ──── 1) 起一個本地 Postgres ────
docker compose -f docker-compose.postgres.yml up -d
# 連線字串：postgresql://together:together@localhost:5432/together
# 不想用 docker？把 .env.postgres.example 改成你自己的 host / pw 即可

# ──── 2) 從現在的 SQLite 把所有資料倒成 JSON ────
#    （30 個 model 全包，按 parent → child 順序，FK 不會亂）
npm run db:export-json
# → tmp/export/{Role,Permission,User,Post,...}.json + manifest.json

# ──── 3) 切換 schema 到 postgresql + 換 DATABASE_URL ────
#    prisma/schema.prisma:
#      datasource db { provider = "postgresql"  url = env("DATABASE_URL") }
#    .env：複製 .env.postgres.example → .env
cp .env.postgres.example .env

# ──── 4) 重新產生 migration（Prisma 的 migration 檔是 provider-specific）────
#    SQLite 版本的 ALTER 用「表重建」、Postgres 用真正的 ALTER COLUMN，
#    所以要重新建一個 Postgres 基準 migration。SQLite 的 migrations
#    歷史在 git 裡保留，新 branch 只放 postgres 那一份。
rm -rf prisma/migrations
npx prisma migrate dev --name init_postgres
#    （這時 Postgres 是空的，OK 直接套）

# ──── 5) 把 JSON 倒進 Postgres ────
npm run db:import-json
#    安全檢查：DB 已有 user → 拒絕，加 --force 才覆寫
#    輸出每張表的 row 數，方便比對

# ──── 6) 驗證 ────
npm run dev
#    用 admin / 你原本的密碼登入；feed 上的 post / activity / poll 應該都在
```

### 這套工具能/不能做什麼

✅ **能做的**：30 個 model 全部 round-trip（在 SQLite → SQLite 上測過 226 列無遺失），JSON 通用、provider-agnostic，FK 順序正確，DATETIME ↔ TIMESTAMP 由 Prisma 自動轉。

⚠️ **要注意的**：
- `db:import-json` 預設拒絕匯入到「已有 User」的 DB（防呆，避免兩個 admin 對撞）。明知道在做什麼才加 `--force`。
- SQLite 沒有 `skipDuplicates` 選項；本工具刻意不用，靠上述防呆。Postgres 雖然支援也不開，理由一樣。
- 換完 Postgres 後，`TRUST_PROXY` / `RESEND_API_KEY` 等環境變數沿用，不用改。
- 已 commit 的 SQLite migration 歷史**不要刪**——別的分支還會用。在 postgres 分支上才覆寫 `prisma/migrations/`。

### 不想用 docker？
直接連到任何托管 Postgres（Neon / Supabase / Railway / RDS），把 `DATABASE_URL` 改成它的連線字串，跳過第 1 步。

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
