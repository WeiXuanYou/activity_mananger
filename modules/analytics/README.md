# modules/analytics

分析模組——**刻意隔離**，是 `core` 唯一可以「呼叫但不可被呼叫」的對象。

## 用途

- 提供 `emit(kind, subject, properties, userId?)`——`core` 在發生有趣事件時呼叫
- 提供 dashboard 資料：KPI 數字、趨勢圖、最活躍成員、投票偏好、分類分布
- 提供 `KpiCard`、`TrendChart` 等獨立風格的元件（深色 slate header，刻意視覺區隔）

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `AnalyticsEvent` | type | append-only 事件 row：kind / userId? / subjectType / subjectId / properties / createdAt |
| `AnalyticsEventKind` | type | `"vote.cast" \| "activity.rsvp" \| "post.created" \| "post.viewed" \| "page.viewed" \| "permission.requested"` |
| `emit(kind, subject, properties?, userId?)` | fn | **唯一從 core 進來的接點**（Phase A 是 stub，Phase E 接 Prisma） |
| `kpis`, `trendWeeks`, `topMembers`, `topPosts`, `votingPatterns`, `categoryDistribution` | consts | mock dashboard 資料 |
| `KpiCard`, `TrendChart` | components | UI |

## **絕對紅線**

**`analytics` 不可以讀 `core` 的 table**——只能讀 `AnalyticsEvent`。
這個防火牆是「未來可以抽出獨立服務」的關鍵。如果分析 query 直接 JOIN core
table，要把 analytics 拆出來就要連 schema 一起搬。

`emit()` 是 **單向呼叫**：
```
                          ┌─ analytics.emit() ──┐
core (activities/posts/…)─┤                     ├─→ AnalyticsEvent table
                          └─────────────────────┘
```

## 加新事件類型

1. 在 `types.ts` 的 `AnalyticsEventKind` 聯合加新 key（例如 `"comment.posted"`）
2. 在 core 的 server action 內呼叫 `emit("comment.posted", { type: "comment", id }, { ... })`
3. 在 `queries.ts` 加新的彙整函式（Phase E：直接 `db.analyticsEvent.groupBy(...)`）
4. 在 dashboard 加新元件

## 抽出獨立服務（未來路線）

當 analytics 流量大到需要獨立 scale 時：

1. 把 `modules/analytics/` 整個搬到另一個 Next.js app
2. 把 `AnalyticsEvent` table 移到獨立 DB（或保留同 DB 但分 schema）
3. `core` 的 `emit()` 改成 HTTP POST 到新服務
4. **`core` 完全不用改其他地方**——這就是隔離的目的

## Phase 進度

- ✅ **Phase A** dashboard mock data + UI
- ✅ **Phase E** `emit()` 真寫 `db.analyticsEvent.create`（fire-and-forget，失敗不阻斷主流程）
- ✅ Phase E `db.ts` 真實彙整查詢：`computeKpisDb` / `eventsByKindDb` / `recentEventsDb` / `topContributorsDb` / `eventsByHourDb`
- ✅ Phase E `/app/analytics` 即時事件流儀表板，gated by `analytics.view`，Editor/Member 訪問會被 middleware-style redirect
- ✅ Core server actions 在關鍵點 `void emit(...)`：post.created / post.viewed / activity.rsvp / vote.cast / permission.requested
- ⬜ Phase E+ 期間比較（this week vs last）、「最常一起活動的人」、「家族活動熱度日曆」等進階分析
