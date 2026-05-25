# modules/core/activities

活動（聚會、烤肉、爬山、生日派對）+ RSVP。

## 用途

- 提供 `Activity` 資料型別與 mock seed
- 提供 `ActivityCard` 元件（封面 + 標題 + 倒數 + RSVP 計數）
- 提供日期相關的查詢：`findNextActivity`、`listUpcomingActivities`、`listPastActivities`

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Activity` | type | id / title / hostId / startsAt(ISO string) / location / cover / rsvp / description / categoryIds |
| `activities` | const | 5 個 seed 活動（含過去 + 未來，用於 demo） |
| `listActivities()` | fn | 所有活動 |
| `findActivity(id)` | fn | 找單一活動 |
| `listActivitiesByDate()` | fn | 依日期升冪排序 |
| `listUpcomingActivities()` | fn | 未來的活動 |
| `listPastActivities()` | fn | 已過去的活動（reverse 過，最近的在前） |
| `findNextActivity()` | fn | 最近一個未來活動（用於「下次相聚」widget） |
| `filterActivitiesByCategory(catId)` | fn | 依分類過濾 |
| `ActivityCard` | component | 一張活動卡（封面 + 倒數 + 分類 chip + RSVP 計數） |

## 日期處理

- `startsAt` 是 ISO-like string（`"2026-09-25 18:00"`），透過 `@/lib/date` 解析
- `daysFromNow(startsAt)` 以一個固定 REFERENCE = 2026-05-25 為「今天」，
  確保 demo 永遠有可預期的「下次活動」（不依賴系統時鐘）

## 與其他模組的關係

```
activities  → members (host / RSVP 對象)
activities  → categories (categoryIds)
activities  → @/lib/date (日期格式化)
activities  ← 被 feed / app/* / 各種頁面引用
```

## Phase 進度

- ✅ **Phase A** mock + UI 完整
- ⬜ **Phase C** 接 Prisma `Activity` table；schema 已建好（含 `ActivityParticipant` 多型 RSVP）
- ⬜ Phase C+ `actions.ts` 內 `createActivity` / `rsvp(activityId, status)` server actions（必過 `requirePermission`）
