# modules/core/feed

混合時間軸——`core/` 內的**組合模組**，把活動 / 文章 / 投票拼成一條 feed。

## 用途

- 提供 `buildFeed({categorySlug})`——回傳排序好的 `FeedItem[]`
- 提供 `FeedHero` / `FeedItem` / `PinnedSection` 三個渲染元件
- 是「擴充新內容類型到時間軸」唯一需要動的地方

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `FeedItemData` | type | 一個 feed 項目的 discriminated union：`{ kind: "activity" \| "post" \| "poll", data }` |
| `FeedBuildOptions` | type | `{ categorySlug?: string }` |
| `buildFeed(opts)` | fn | 組時間軸，可選 slug 過濾 |
| `FeedItem` | component | 渲染一個 feed 項目（pattern-match 在 kind 上） |
| `FeedHero` | component | Feed 頂部問候 banner |
| `PinnedSection` | component | 置頂文章區塊（依 `listPinnedPosts`） |

> Tip：`FeedItemData` 是型別，`FeedItem` 是 component——同名但 TS 在不同 namespace。

## 加新內容類型到時間軸（4 步驟）

1. 在 `modules/core/<thing>/types.ts` 定義新型別（必須有 `categoryIds: string[]`）
2. 在 `modules/core/feed/types.ts` 的 `FeedItem` union 加新分支
3. 在 `modules/core/feed/queries.ts > buildFeed` 把新資料源 push 進 `all`
4. 在 `modules/core/feed/components/FeedItem.tsx` 的 `switch` 加新 `case`

## 為什麼這是「組合模組」

跟其他 core 子模組不同，feed **不擁有自己的資料**。它的 `queries.ts` 只是
把其他模組的輸出拼起來。所以它沒有 `data.ts`，也不直接接 Prisma——
Phase C 把每個來源模組轉成 Prisma 後，`buildFeed` 自動繼承新行為。

## 與其他模組的關係

```
feed  → activities, posts, polls (讀取列表)
feed  → categories (slug→id 解析)
feed  ← 被 app/mockup/feed/page.tsx 直接引用
```

## Phase 進度

- ✅ **Phase A** mock-based 組合 + 過濾
- ⬜ **Phase C** `buildFeed` 改 async，內部改成 `Promise.all([prismaQuery, ...])`，分頁化
