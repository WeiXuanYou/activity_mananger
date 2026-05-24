# 相聚 · Together

封閉式家人/朋友活動管理 + 社群平台。Phase A：互動式視覺原型，採模組化架構。

> **新成員 / AI 助手請先讀 [`AGENTS.md`](./AGENTS.md)** —— 那裡有架構地圖與貢獻原則。

## 啟動

```bash
npm install
npm run dev
```

打開 http://localhost:3000 → 點「進入 Mockup 預覽」或直接前往 http://localhost:3000/mockup

## 目錄結構（高層）

```
app/                Next.js 路由與頁面組合（不放邏輯）
modules/            業務邏輯、資料、元件
  auth/             身份識別（邀請碼、session）
  permissions/      角色、權限矩陣、申請審批、requirePermission()
  core/             社群核心
    members/        成員與頭像
    categories/     分類（預設 + 自訂）+ 篩選、選擇器
    activities/     活動與 RSVP
    posts/          文章、推薦、隨筆、置頂
    polls/          Line 風格投票（倒數、多選、匿名、可新增選項）
    feed/           混合時間軸與首頁元件
  custom-pages/     CMS 自訂頁面（block registry）
  analytics/        分析模組（隔離、單向消費事件）
components/ui/      跨功能 UI 元件（之後加）
lib/                純工具
```

每個 module 都遵守同一結構：`types.ts` / `data.ts` / `queries.ts` / `components/` / `index.ts`。
頁面 **只**從 module 的 `index.ts` 匯入，不深入內部。

## Mockup 涵蓋頁面
`/mockup` · `/mockup/login` · `/mockup/feed`（含分類篩選）· `/mockup/activity` · `/mockup/poll`（Line 風格）· `/mockup/create`（含置頂、分類選擇）· `/mockup/pages` · `/mockup/page-detail` · `/mockup/permissions` · `/mockup/inbox` · `/mockup/analytics` · `/mockup/profile`

## 後續階段
- Phase B 認證 + 權限骨架（接 Prisma + 邀請碼登入）
- Phase C 社群核心接 DB
- Phase D CMS 區塊渲染器擴充
- Phase E 分析模組接事件流
- Phase F 申請審批工作流程
