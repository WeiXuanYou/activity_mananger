# modules/core/categories

分類系統——讓內容能標籤、篩選、聚合。

## 用途

- 提供分類（emoji + 中文名稱 + 顏色）：系統預設 9 個 + 使用者可自訂
- 提供三個 UI 元件：`<CategoryChip>`（顯示）、`<CategoryFilterBar>`（URL 驅動的篩選列）、`<CategoryPicker>`（建立內容時的 client-side picker）
- 提供 slug ↔ id 的查詢輔助（URL 用 slug，資料庫 join 用 id）

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Category` | type | id / slug / name / emoji / color / isDefault / createdById / description |
| `CategoryColor` | type | 顏色聯合：`"terracotta" \| "sage" \| "sand" \| ...` |
| `COLOR_CLASSES` | const | 將顏色 key 映射到 Tailwind class 片段 |
| `categories` | const | seed 資料（9 預設 + 2 自訂） |
| `listCategories`, `listDefaultCategories`, `listCustomCategories` | fns | 列表查詢 |
| `findCategory(id)`, `findCategoryBySlug(slug)`, `findCategoriesByIds(ids)` | fns | 查找 |
| `CategoryChip` | component | 內聯顯示一個分類標籤（可選 link） |
| `CategoryFilterBar` | component | **URL-driven** 篩選列（`?cat=<slug>`） |
| `CategoryPicker` | component | client-side 多選器，限制最多 N 個 |

## 設計重點

- **slug vs id**：URL 用 `slug`（人類可讀且穩定），DB join 用 `id`（cuid，永遠不衝突）
- **顏色集中管理**：所有顏色從 `COLOR_CLASSES` 取得 Tailwind class，UI 元件不應自己 hardcode 色票
- **`CategoryFilterBar` 是 server-component-friendly**——用 `<Link>` 切換 URL 參數，不需要 client state；頁面讀 `searchParams.cat` 自己過濾

## 與其他模組的關係

```
categories  → 無上游依賴
categories  ← 被 activities / posts / polls / custom-pages / feed 引用（每個 entity 有 categoryIds[]）
```

## 加新預設分類

1. 在 `data.ts` 的 `categories` 陣列加新 entry（`isDefault: true`）
2. 更新 `prisma/seed.ts` 的 `CATEGORIES` 陣列
3. 跑 `npm run db:seed`

## 加新顏色

1. 在 `types.ts` 的 `CategoryColor` 聯合加新名字
2. 在 `COLOR_CLASSES` 物件加對應 entry（4 個 class 片段：bg / bgSoft / text / ring）
3. 任何使用顏色的 UI 自動可用

## Phase 進度

- ✅ **Phase A** mock data + UI（含 URL-driven filter）
- ✅ Slug-based 查詢全部 wire 好
- ⬜ **Phase C** `data.ts` → Prisma `Category` table；同 schema 已建好
- ⬜ Phase C+ 「建立新分類」UI（目前 picker 有按鈕但未實作）
