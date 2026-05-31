# modules/uploads

圖片上傳。處理活動封面、文章附圖等的接收、驗證、縮圖、寫檔。

## 用途

- 接收使用者上傳的圖片，驗證 MIME + 大小
- 產生 800px 邊長的 JPEG 縮圖（grid / card 用），原圖另存（lightbox / 詳情用）
- 提供 `<ImageUpload>` client component 給各表單共用

## 公開 API

從 `@/modules/uploads` 引用：

| 名稱 | 說明 |
|---|---|
| `ImageUpload` | 上傳按鈕 client component |
| `UploadResult` | `{ ok: true, url, thumbUrl } \| { ok: false, error }` 型別 |
| `ALLOWED_IMAGE_MIME` | 允許的 MIME 白名單（jpeg / png / webp / gif） |
| `MAX_IMAGE_BYTES` | 單張上限（5 MB） |

> `uploadImageAction` 刻意**不**從 barrel 匯出——它在 `actions.ts` 的 `"use server"` 後面，由 client component 從 `@/modules/uploads/actions` 這個窄路徑引用。

## 設計決策

- **縮圖用 sharp**：sharp 處理不了（例如動畫 GIF）時，`thumbUrl` 退回原圖 `url`。
- **與頭像分開**：profile 頭像走 `modules/auth`（小圖、base64 inline 存 DB）；這個模組處理較大的內容圖片（寫檔、有縮圖）。兩者驗證規則不同、儲存策略不同，刻意不共用。

## 與其他模組的依賴

```
uploads  ← 被 activities（封面）、posts（附圖）、custom-pages（圖片 block）引用
```
