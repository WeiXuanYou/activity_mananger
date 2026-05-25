# modules/core/members

成員資料 + 頭像元件。

## 用途

- 提供「成員」型別（家人朋友的基本資料）
- 提供 `<Avatar>` 與 `<AvatarStack>` 元件（彩色圓形 + 初始字）
- 提供 mock 階段的「目前使用者」同步取值 `getMockCurrentUser()`——給 `/mockup/*` 用

## 公開 API

| 名稱 | 類型 | 說明 |
|---|---|---|
| `Member` | type | id / name / handle / role / avatarColor / initial |
| `members` | const | 6 個 seed members（Phase A 用） |
| `listMembers()` | fn | 回傳全部成員 |
| `findMember(id)` | fn | 找單一成員，找不到會 throw（mock 階段資料應該不會缺） |
| `getMockCurrentUser()` | fn | **同步**，回傳「媽媽」作為 mockup 預設使用者 |
| `Avatar` | component | 單一頭像（彩色圓 + 初始字） |
| `AvatarStack` | component | 重疊顯示多個頭像 + `+N` 溢出指示 |

## 與其他模組的關係

```
members  → auth (僅 import Role type)
members  ← 被 categories / activities / posts / polls / feed / custom-pages 引用
```

注意：`getMockCurrentUser` 是 **同步**，僅給 mockup 用。
**真實認證後的 `/app/*` 頁面請用 `await getCurrentUser()` from `@/modules/auth`。**

## Phase 進度

- ✅ **Phase A** mock data + 元件
- ⬜ **Phase C** `data.ts` → `queries.ts` 讀 Prisma User table；保留 `Member` 型別作為 UI 抽象層
- ⬜ Phase C+ 加 `MemberProfile` 元件（完整個人檔案頁面）
