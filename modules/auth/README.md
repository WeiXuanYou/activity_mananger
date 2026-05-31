# modules/auth

身份識別與帳戶管理。真實 cookie session 接 Prisma。

## 用途

- 邀請碼註冊 + handle/密碼登入（封閉社群，沒有公開註冊）
- 簽名 cookie session 管理（30 天 TTL）
- 暴露 `getCurrentUser()` 給整個 app 使用
- 邀請碼產生（給管理員後端工具用）
- 首次登入的 profile 設定流程（含必填 Email）
- 帳戶自助設定（改頭像 / 名字 / Email / 密碼 / 登出其他裝置）
- 以 Email 為基礎的密碼 / handle 找回
- 公開端點的防爆力限流 + 共用欄位驗證

## 公開 API

從 `@/modules/auth` 引用：

| 名稱 | 類型 | 說明 |
|---|---|---|
| `getCurrentUser()` | async fn | 讀 cookie → 查 session → 回傳 User（含 role / permissions），未登入回 `null` |
| `requireCurrentUser()` | async fn | 同上但未登入會 throw（用於必須有身份的 server component） |
| `CurrentUser` | type | `getCurrentUser` 回傳值的非 null 版型別 |
| `redeemInvite(code)` | async fn | 兌換邀請碼，回傳新建/復用的 user id |
| `generateInviteCode({ createdById, defaultRoleName })` | async fn | 產生新邀請碼 |
| `createSession`, `setSessionCookie`, `clearSessionCookie`, `signOut` | async fns | session 低階操作 |
| `signInWithInviteAction` | server action | 給 `<form action={…}>` 用，會自動 redirect 到 `/app/feed`（IP 限流） |
| `signOutAction` | server action | 給登出按鈕用，redirect 到 `/login` |
| `Role` | type | `"Guest" \| "Member" \| "Editor" \| "Admin"` |

其他 server actions（從 `@/modules/auth/actions` 引用，給對應頁面的 form / client component 用）：

| 名稱 | 說明 |
|---|---|
| `signInWithPasswordAction` | handle + 密碼登入（IP 限流，錯誤訊息刻意模糊不洩漏帳號是否存在） |
| `completeSetupAction` | 首次登入設定 profile，**Email 必填**，撞 handle/email 唯一性回友善訊息 |
| `updateProfileAction` | 帳戶設定：改 name/handle/avatar/email/birthday（email 可改不可清空） |
| `changePasswordAction` | 改密碼，需驗證現有密碼，依使用者限流 |
| `signOutOtherSessionsAction` | 踢掉除當前以外的所有 session；找不到當前 session 時拒絕（不會誤刪全部） |
| `requestPasswordResetAction` / `requestHandleRecoveryAction` | 公開找回端點，IP 限流、不洩漏帳號存在；handle recovery 也有 60s 冷卻 |
| `resetPasswordWithTokenAction` | 用 token 設新密碼，成功後自動登入 |
| `resendVerificationEmailAction` | 帳戶設定的「重新寄驗證信」按鈕；依使用者限流 |
| `verifyEmailAction(token)` | `/verify-email` 公開頁用，標記 `User.emailVerifiedAt` |

驗證工具（從 `@/modules/auth/validation` 引用，**同構**，client/server 共用）：
`validateName` / `validateHandle` / `validateEmail` / `validatePassword` / `validateAvatarColor` / `validateAvatarImage`（含 magic-bytes 檢查）/ `validateBirthday`、常數 `AVATAR_PALETTE` / `AVATAR_MAX_BYTES` / `MIN_PASSWORD_LEN`。

**注意**：`getCurrentUser` 是 **async**。`/mockup/*` 頁需要同步取假使用者請改用
`getMockCurrentUser()`（在 `@/modules/core/members`）。

## 內部檔案

```
modules/auth/
  index.ts        ← public barrel
  types.ts        Role union type
  session.ts      Cookie session：tokenHash 比對、TTL、createSession / getCurrentUser / signOut
  password.ts     scrypt 雜湊 / 驗證（加鹽 + 等時比對）
  invite.ts       邀請碼兌換邏輯：第一次用會自動 create user，之後重複用會復用同一帳號
  recovery.ts     密碼 / handle 找回：雜湊一次性 token、email 綁定、踢 session、防灌信冷卻
  verify-email.ts Email 驗證流程：設定/變更 email 後自動發確認信、24h TTL、email-pin 防舊連結
  validation.ts   同構欄位驗證（無 next/db 依賴），client + server 共用同一份規則
  rate-limit.ts   in-memory sliding-window 限流（login / recovery / changePassword）
  request-meta.ts getRequestMeta()：從 proxy header 取 origin + client IP（受 TRUST_PROXY 控制）
  actions.ts      "use server" 的 server actions（form / client component 用）
```

對應測試：`validation.test.ts`、`rate-limit.test.ts`（共 52 個單元測試）。

## 與其他模組的依賴

```
auth  ← 被 permissions 引用（permissions/guard.ts 呼叫 getCurrentUser）
auth  ← 被 app/login、app/app/* 引用
auth  → 引用 @/lib/db
auth  → 引用 modules/core/members（僅 types，用於匿名兌換流程）
```

## 安全注意事項

- Cookie：`httpOnly`、`sameSite=lax`、production 開 `secure`
- Session token 用 `crypto.randomBytes(32)` 產生，DB 只存 SHA-256 hash（即便 DB 外洩也無法回推 token）
- TTL 30 天，目前 expire 後 `getCurrentUser` 回 null（沒有自動 refresh）
- 邀請碼長度短，僅供 demo；正式產品應該至少 32-bit 加長

## ⚠️ 部署模型假設（單一長駐 Node 行程）

這個模組的兩個機制刻意做成 in-process，因為預設目標是**單一長駐的 Node 行程**（自架、家人朋友規模）：

1. **Rate limiter（`rate-limit.ts`）是 per-process in-memory `Map`**。多實例 / serverless（每次 cold start 都是新行程）下，限流幾乎失效——每個實例各自一份計數。要在那種環境下用，把 `RateLimiter` 介面換成 Redis/DB 後端（介面已預留）。

2. **找回信件是 fire-and-forget（`recovery.ts` 的 `void sendEmail(...)`）**，刻意不 await 以關閉 timing enumeration channel。在長駐行程下沒問題；但在 **serverless（Vercel / Lambda）行程可能在 action return 後立刻凍結**，導致信還沒送出就被中斷。若要 serverless 佈署，請改用平台的背景任務 API（例如 Vercel 的 `waitUntil()`）包住寄信呼叫。

## Phase 進度

- ✅ **Phase B** 真實 session + 邀請碼
- ⬜ Phase B+ session refresh、邀請碼到期時間 UI、log out all sessions
- ⬜ Phase G+ 多認證 provider（OAuth）—— 預期擴充 `actions.ts` 加新 provider，
  `getCurrentUser` 不用改

## 擴充指引

**新增登入方式**（例如 Google OAuth）：
1. 在 `modules/auth/providers/` 新增 provider 檔案
2. 在 `actions.ts` 加新的 server action
3. `getCurrentUser` 不用改——只認 cookie

**新增邀請碼欄位**（例如「使用者首次登入訊息」）：
1. 改 `prisma/schema.prisma` 的 InviteCode model
2. `npm run db:migrate`（建立 migration；正式環境用 `npm run db:deploy`）
3. 改 `invite.ts` 的 `redeemInvite` 回傳值

**新增 profile 欄位**（例如「自我介紹」）：
1. 改 `prisma/schema.prisma` 的 User model → `npm run db:migrate`
2. 在 `validation.ts` 加 `validateXxx`（client/server 共用）
3. `completeSetupAction` + `updateProfileAction` 各加一段（記得唯一性走 try/catch translateUniqueError）
4. `SetupForm` + `AccountSettingsForm` 加欄位

**新增找回管道 / 限流端點**：
1. 在 `rate-limit.ts` 建一個 `createRateLimiter({...})` singleton
2. 在 action 裡 `getRequestMeta()` 取 IP → `check` / `hit` / `reset`
