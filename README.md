# 家圈 · Family Circle

封閉式家人/朋友活動管理 + 社群平台。Phase A：互動式視覺原型。

## 啟動

```bash
npm install
npm run dev
```

打開 http://localhost:3000 → 點「進入 Mockup 預覽」或直接前往 http://localhost:3000/mockup

## Mockup 涵蓋頁面

- `/mockup` 索引
- `/mockup/login` 邀請碼登入
- `/mockup/feed` 動態首頁
- `/mockup/activity` 活動詳情
- `/mockup/poll` 投票
- `/mockup/create` 建立內容（Post / Activity / Poll）
- `/mockup/pages` 自訂頁面書架
- `/mockup/page-detail` CMS 頁面範例（多種 block）
- `/mockup/permissions` 權限申請
- `/mockup/inbox` 管理員審批
- `/mockup/analytics` 分析儀表板（刻意換配色強調模組邊界）
- `/mockup/profile` 個人檔案

## 後續階段
依規劃 `/root/.claude/plans/1-curried-rainbow.md`：
- Phase B 認證 + 權限骨架
- Phase C 社群核心接 DB
- Phase D CMS 自訂頁面
- Phase E 分析模組
- Phase F 權限申請審批流程
