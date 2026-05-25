# modules/auth

身份識別與 session 管理。**Phase B 已上線**——真實 cookie session 接 Prisma。

## 用途

- 邀請碼登入 / 重新進入（封閉社群，沒有公開註冊）
- 簽名 cookie session 管理（30 天 TTL）
- 暴露 `getCurrentUser()` 給整個 app 使用
- 邀請碼產生（給管理員後端工具用）

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
| `signInWithInviteAction` | server action | 給 `<form action={…}>` 用，會自動 redirect 到 `/app/feed` |
| `signOutAction` | server action | 給登出按鈕用，redirect 到 `/login` |
| `Role` | type | `"Guest" \| "Member" \| "Editor" \| "Admin"` |

**注意**：`getCurrentUser` 是 **async**。`/mockup/*` 頁需要同步取假使用者請改用
`getMockCurrentUser()`（在 `@/modules/core/members`）。

## 內部檔案

```
modules/auth/
  index.ts        ← public barrel
  types.ts        Role union type
  session.ts      Cookie session：tokenHash 比對、TTL、createSession / getCurrentUser / signOut
  invite.ts       邀請碼兌換邏輯：第一次用會自動 create user，之後重複用會復用同一帳號
  actions.ts      "use server" 的 server actions（form action 用）
```

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
2. `prisma db push`
3. 改 `invite.ts` 的 `redeemInvite` 回傳值
