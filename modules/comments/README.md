# modules/comments

跨內容類型的留言串。利用 schema 的多型 `Comment.parentType + parentId`，
一張表服務 posts / activities / custom pages / 留言回覆，**新增可留言類型不需動 schema**。

## 用途

- 在活動/文章/頁面下方顯示留言
- 任何登入成員可發表留言（`comment.create`）
- 作者可刪自己的留言；Editor 可審查刪除（`comment.moderate`）
- 留言送出後**自動通知**內容擁有者

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Comment` / `CommentParentType` | type | 多型 parent 設計 |
| `listCommentsDb(parentType, parentId)` | async fn | 取頂層留言（依 createdAt 升冪） |
| `countCommentsDb(parentType, parentId)` | async fn | 留言數（給卡片顯示） |
| `CommentList` | component | 渲染留言串（已含刪除按鈕） |
| `CommentForm` | component | 留言輸入框（含 Ctrl/⌘+Enter 送出） |
| `createCommentAction` / `deleteCommentAction` | server actions | 過 `requirePermission` |

## 擴充：加新可留言類型

1. 在 `types.ts` 的 `CommentParentType` 加新值（例如 `"POLL"`）
2. 在 `createCommentAction` 的通知分支加查詢該類型擁有者的邏輯
3. 在頁面用 `listCommentsDb("POLL", pollId)` + `<CommentList>` + `<CommentForm>`

不需動 schema。

## Phase 進度

- ✅ Phase H：活動 + 文章 + 頁面留言
- ⬜ Phase H+：留言巢狀回覆 UI、reaction（讚/愛心）on comments
