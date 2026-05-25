# modules/core/posts

文章 / 推薦 / 隨筆 + 置頂機制。

## 用途

- 提供 `Post` 型別與 3 種 kinds：`ARTICLE`、`RECOMMENDATION`、`NOTE`
- 置頂機制（`isPinned` + `pinnedById`），管理員可在 Feed 最上方固定文章
- `PostCard` 元件——置頂文章自動套用溫暖漸層背景

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Post` | type | id / authorId / kind / title? / body / likes / comments / createdAt / isPinned? / pinnedById? / categoryIds |
| `PostKind` | type | `"ARTICLE" \| "RECOMMENDATION" \| "NOTE"` |
| `posts` | const | seed 資料 |
| `listPosts()`, `listPinnedPosts()`, `listUnpinnedPosts()` | fns | 列表查詢 |
| `findPost(id)`, `filterPostsByCategory`, `filterPostsByAuthor` | fns | 過濾查詢 |
| `PostCard` | component | 一張文章卡（置頂時換漸層背景） |

## 設計重點

- **置頂與一般時間軸分離**：`buildFeed` 在 `modules/core/feed/queries.ts` 主動排除置頂文章；
  頁面用 `<PinnedSection>` 在 Feed 頂部單獨顯示置頂文章。
- `kind` 用字串聯合而非 enum——對應 Prisma 的 `String` 欄位，免 runtime 開銷。

## 權限

| 動作 | 需要的權限 |
|---|---|
| 發文 | `post.create`（Member+） |
| 置頂 | `post.pin`（Editor+） |

## 與其他模組的關係

```
posts  → members (作者)
posts  → categories (categoryIds)
posts  ← 被 feed / pages / 各種列表引用
```

## Phase 進度

- ✅ **Phase A** mock + UI 完整
- ⬜ **Phase C** 接 Prisma `Post` table；schema 已建好（含 `pinnedBy` 關聯）
- ⬜ Phase C+ `actions.ts` 內 `createPost(input)` / `pinPost(id)` server actions
