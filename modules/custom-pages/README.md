# modules/custom-pages

自訂頁面（CMS）——每個成員可以用 block 堆出自己的小頁面。

## 用途

- 「外公的故事」、「我們家的食譜書」、「小毛成長日記」這類使用者擁有的內容頁
- **可擴充的 block renderer 系統**——目前實作 `richtext`，已預留 `markdown` / `html` / `image` / `embed-poll`
- 支援分類（同其他 core 模組一樣有 `categoryIds`）

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `CustomPage` | type | id / slug / title / ownerId / excerpt / cover / blocks / categoryIds |
| `BlockType` | type | `"richtext" \| "markdown" \| "html" \| "image" \| "embed-poll"` |
| `BlockData` | type | `Record<string, unknown>`——每個 block 自己解讀 |
| `customPages` | const | seed 資料 |
| `listCustomPages()`, `findCustomPage(id)`, `filterCustomPagesByCategorySlug(slug)`, `filterCustomPagesByOwner(uid)` | fns | 查詢 |
| `PageCard` | component | 書架格的單張頁面卡 |
| `registerBlockRenderer(r)`, `getBlockRenderer(type)`, `listRegisteredBlockTypes()` | fns | block 註冊 / 取用 |

## Block Renderer Registry（擴充重點）

**架構**：`block-renderers/` 目錄下，`registry.ts` 是純資料儲存，
`index.ts` 是公開 API + side-effect import 各個 renderer，每個 renderer 自己
呼叫 `registerBlockRenderer()` 把自己註冊進來。

```
block-renderers/
  registry.ts        in-memory Map + register/get/list 函式
  RichText.tsx       side-effect import 自己註冊
  Markdown.tsx       (Phase D 預留)
  Html.tsx           (Phase D 預留)
  index.ts           re-export API + import 所有 renderer
```

之前曾有「循環匯入」bug（每個 renderer import 自 index.ts，index.ts 又 import
每個 renderer）——所以拆出 `registry.ts` 作為單一信號的儲存層。

### 加新 block 類型

1. 在 `types.ts` 的 `BlockType` 聯合加新字串（例如 `"video"`）
2. 在 `block-renderers/Video.tsx` 寫 component + 呼叫 `registerBlockRenderer(...)`
3. 在 `block-renderers/index.ts` 加 `import "./Video"`
4. 完成——所有 `getBlockRenderer("video")` 自動可用

## 權限

| 動作 | 需要的權限 |
|---|---|
| 建立頁面 | `page.create`（Member+） |
| 發布頁面 | `page.publish`（Editor+） |

## Phase 進度

- ✅ **Phase A** mock data + UI + RichText renderer
- ✅ Block renderer registry pattern 確立
- ⬜ **Phase D** Markdown renderer + HTML renderer（sanitized）
- ⬜ Phase D+ 拖拉式 block 編輯器
- ⬜ Phase C/D 接 Prisma `CustomPage` / `CustomPageBlock` table（schema 已建好；
  data 欄位是 JSON-encoded string for SQLite，PostgreSQL 升級時改 Json type）
