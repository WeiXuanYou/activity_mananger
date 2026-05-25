# modules/core

社群核心——所有「使用者看得到的東西」的模型與元件。

## 子模組

| 子模組 | 用途 | README |
|---|---|---|
| `members/`    | 成員資料 + 頭像元件 | [README](./members/README.md) |
| `categories/` | 分類系統（預設 + 自訂）+ 篩選列 | [README](./categories/README.md) |
| `activities/` | 活動 + RSVP | [README](./activities/README.md) |
| `posts/`      | 文章 / 推薦 / 隨筆 + 置頂 | [README](./posts/README.md) |
| `polls/`      | Line 風格投票 | [README](./polls/README.md) |
| `feed/`       | 混合時間軸（組合模組） | [README](./feed/README.md) |

## 設計重點

- 每個 entity 都有 `categoryIds: string[]`——分類是橫向的，可以對應到 post、activity、poll、custom-page
- 多型 parent 設計留好（schema 的 `Comment.parentType` / `Reaction.parentType`），未來新增「可留言的東西」不用改 schema
- `feed/` 是組合模組，**不擁有自己的資料**——它把其他子模組的輸出拼起來

## 紅線

- 不可從 `core/*` import `modules/analytics/*` 的任何東西，**除了** `analytics.emit()`
- 所有 mutate server action 開頭必須 `await requirePermission(...)`

## 擴充：加新內容類型

例如「願望」(`wish`)：

1. `mkdir modules/core/wishes && cd modules/core/wishes`
2. 建立 `types.ts` / `data.ts` / `queries.ts` / `components/WishCard.tsx` / `index.ts`
3. 在 `modules/core/feed/types.ts` 的 `FeedItem` 加 `| { kind: "wish"; data: Wish }`
4. 在 `modules/core/feed/queries.ts > buildFeed` push 願望進 `all`
5. 在 `modules/core/feed/components/FeedItem.tsx` 的 switch 加 `case "wish"`
6. （Phase C+）在 `prisma/schema.prisma` 加 `Wish` model + `WishCategory` join，
   加 `actions.ts` 的 `createWish`（呼叫 `requirePermission("wish.create")`）
