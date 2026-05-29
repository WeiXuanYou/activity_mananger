# modules/notifications

站內通知——公用導向社群的單向「有件事跟你有關」管道（無私訊）。

## 用途

- 產生站內通知：權限申請被核准/拒絕、有人 RSVP 你的活動、文章被置頂等
- 提供 bell（含未讀數）與 `/app/notifications` 列表
- `notify()` 是唯一進入點，和 `analytics.emit()` 同樣是「單一接縫、fire-and-forget」

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Notification` / `NotificationKind` | type | 通知資料模型 |
| `notify({ userId, kind, title, body, link? })` | async fn | **唯一進入點**——其他模組呼叫它產生通知 |
| `listNotificationsDb(userId, limit?)` | async fn | 列出某人的通知（相對時間） |
| `unreadCountDb(userId)` | async fn | 未讀數（給 bell badge） |
| `markAllReadAction` / `markReadAction` | server actions | 標記已讀 |
| `NotificationBell` | component | header 鈴鐺 + 未讀 badge |

## 設計

- `notify()` 直接寫 `Notification` 表。與 analytics 不同——通知是社群核心體驗的一部分，不是隔離的唯讀消費者。
- Fire-and-forget：try/catch 包住，通知失敗永不阻斷觸發它的動作。
- **無 DM**：符合產品「公用為主、不需個人私訊」的需求。通知只是事件提醒。

## 目前接入的事件

| 來源 | kind | 觸發 |
|---|---|---|
| `permissions/actions.ts` `approveRequestAction` | `permission.approved` | 申請者收到 |
| `permissions/actions.ts` `rejectRequestAction` | `permission.rejected` | 申請者收到 |
| `permissions/admin.ts` `setUserRoleAction` | `permission.approved` | 被改角色者收到 |
| `core/activities/actions.ts` `rsvpAction` | `activity.rsvp` | 活動主辦人收到 |

## 加新通知

1. 在 `types.ts` 的 `NotificationKind` 加 key
2. 在觸發點呼叫 `void notify({ userId, kind, title, body, link })`
3. 在 `/app/notifications` 的 `KIND_EMOJI` 加 emoji

## Phase 進度
- ✅ **Phase F** 通知 + bell + 列表 + 4 個事件接入
- ⬜ Phase F+ 即時推播（SSE / web push）、通知偏好設定
