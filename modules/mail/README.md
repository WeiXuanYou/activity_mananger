# modules/mail

最小寄信子系統。用 HTTP 打 [Resend](https://resend.com) API，沒有設定金鑰時退回寫到 server log。

## 用途

- 給 `modules/auth/recovery.ts` 寄「重設密碼」/「找回 handle」信
- 刻意極簡：一個 `fetch` 呼叫，無 SMTP socket、無額外 npm 依賴、無樣板引擎

## 公開 API

從 `@/modules/mail` 引用：

| 名稱 | 說明 |
|---|---|
| `sendEmail(msg)` | best-effort 寄信，**永遠** resolve 成 `{ ok: true }`（見下方失敗策略） |
| `MailMessage` | `{ to, subject, text, html? }` 型別 |

## 環境變數

| Env var | 用途 |
|---|---|
| `RESEND_API_KEY` | 沒設 → 信件內容寫進 server log（自架 / 開發；管理員可手動把連結轉給使用者）。設了 → 經 `api.resend.com` 真的寄出。 |
| `MAIL_FROM` | 寄件人，預設 `相聚 Together <onboarding@resend.dev>`。正式環境請改成已驗證網域。 |

## 設計決策

- **失敗非致命**：寄信失敗（網路、DNS、逾時、非 2xx）只 log、不 throw。呼叫端（找回流程）對「請求成功與否」的判斷只看 token 是否發出，不看信是否送達——避免退信把使用者鎖在門外，也避免洩漏帳號是否存在。
- **5 秒逾時**：`fetch` 帶 `AbortSignal.timeout(5000)`。否則 Resend 卡住會讓未驗證的 `/forgot` 端點佔住連線（DoS 面）。
- **fire-and-forget 由呼叫端決定**：`recovery.ts` 用 `void sendEmail(...)` 不 await，以關閉 timing enumeration channel。⚠️ serverless 佈署需改用 `waitUntil()` 包住——見 `modules/auth/README.md` 的部署模型假設。

## 擴充

要加新信件類型（例如 Email 驗證信），直接在呼叫端組 `MailMessage` 並呼叫 `sendEmail`。HTML 樣板維持 inline style、無遠端資源即可。
