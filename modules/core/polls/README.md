# modules/core/polls

Line 風格投票工具。

## 用途

- 完整的投票模型：問題 + 選項 + 截止日 + 多選/匿名/允許新增選項
- `PollCard` 元件，含倒數 chip、漸層進度條、後加選項標記
- 留言型別 `Comment` 也住在這裡（與投票留言共用）

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Poll` | type | 完整投票 model（含設定旗標） |
| `PollOption` | type | 選項：id / label / votes / addedById? |
| `PollStatus` | type | `"OPEN" \| "CLOSING_SOON" \| "CLOSED"` |
| `Comment` | type | id / authorId / body / createdAt（給活動詳情頁的留言用） |
| `polls`, `sampleComments` | consts | seed 資料 |
| `listPolls()`, `findPoll(id)`, `filterPollsByCategory(catId)` | fns | 查詢 |
| `PollCard` | component | 一張投票卡（含倒數 / 多選 / 匿名 indicator） |

## 投票特性

- **`multiSelect`**：單選用圓形、多選用方形勾選框
- **`anonymous`**：投了什麼匿名（但票數仍公開）
- **`allowAddOption`**：是否允許家人朋友新增選項；後加的選項顯示「後加」標記
- **`closesAt` + `closesIn`**：截止日 + 人類可讀倒數（"還有 3 天"、"今天截止 ⏰"）

`PollStatus` 是給 UI 顯示用的衍生狀態：
- `OPEN`：還早，普通綠色 chip
- `CLOSING_SOON`：剩 3 天內，紅色 chip 加上 `animate-pulse`
- `CLOSED`：截止後，灰色 chip

## 權限

| 動作 | 需要的權限 |
|---|---|
| 發起投票 | `poll.create`（Editor+） |
| 投票 | （無權限 key——任何登入者都可投自己有讀權限的投票） |

## 與其他模組的關係

```
polls  → members (發起人 / 投票人)
polls  → categories (categoryIds)
polls  ← 被 feed / activities (內嵌投票) / pages 引用
```

## Phase 進度

- ✅ **Phase A** mock + UI 完整
- ⬜ **Phase C** 接 Prisma `Poll` / `PollOption` / `PollVote` table；schema 已建好
- ⬜ Phase C+ `actions.ts` 內 `createPoll(input)` / `castVote(optionId)` / `addOption(pollId, label)` server actions
