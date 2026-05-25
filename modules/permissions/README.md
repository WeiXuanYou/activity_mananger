# modules/permissions

角色與權限——「**所有保護動作的單一通道**」。

## 用途

- 定義系統四個內建角色（`Guest` / `Member` / `Editor` / `Admin`）與每個角色擁有的權限矩陣
- 提供 `requirePermission()`——所有 mutate / 非公開讀的單一檢查通道
- 提供 `<RoleBadge>`、`canCurrentUser()` 等 UI 友善的輔助
- 管理「申請升級權限」的資料模型（PermissionRequest）

## 公開 API

從 `@/modules/permissions` 引用：

| 名稱 | 類型 | 說明 |
|---|---|---|
| `PermissionKey` | type | 細粒度權限字串聯合：`"post.create" \| "post.pin" \| ...` |
| `requirePermission(key)` | async fn | 讀 session → 比對角色矩陣 → 不符就 throw `PermissionDeniedError` |
| `canCurrentUser(key)` | async fn | 同上但回 boolean，不 throw（UI 顯示用） |
| `roleHas(role, key)` | sync fn | 純函式比對，給已知角色的場景用 |
| `PermissionDeniedError` | class | `requirePermission` 失敗時的錯誤型別 |
| `ROLE_PERMISSIONS` | const | `Record<Role, PermissionKey[]>` 權限矩陣（單一真實來源） |
| `ROLE_LABEL`, `ROLE_DESCRIPTIONS` | const | UI 文案 |
| `RoleBadge` | component | 顯示角色徽章（顏色依角色而定） |
| `PermissionRequest` | type | 升級申請的資料模型 |
| `listPendingRequests`, `listDecidedRequests`, `listRequestsByUser` | fns | 申請查詢輔助 |

## 紅線（**絕對不要破**）

**所有 mutation 必須先呼叫 `requirePermission(...)`。** 沒有例外。
這是整個 app 的安全模型核心——只要這個通道沒漏，就無法繞過權限。

範例（正確）：
```ts
"use server";
import { requirePermission } from "@/modules/permissions";

export async function pinPost(postId: string) {
  await requirePermission("post.pin");   // ← 通道
  await db.post.update({ where: { id: postId }, data: { isPinned: true } });
}
```

## 內部檔案

```
modules/permissions/
  index.ts        ← public barrel
  types.ts        PermissionKey / PermissionRequest types
  data.ts         ROLE_PERMISSIONS 矩陣 + 文案 + mock 申請資料
  guard.ts        requirePermission / canCurrentUser / roleHas / PermissionDeniedError
  queries.ts      申請列表查詢 helpers
  components/
    RoleBadge.tsx 角色徽章 UI
```

## 與其他模組的依賴

```
permissions  → auth   （讀 session）
permissions  ← 被所有 mutation 引用（Phase B+：core 的 server actions）
```

## 加新權限

1. 在 `types.ts` 的 `PermissionKey` 聯合加新字串（例如 `"reaction.delete"`）
2. 在 `data.ts` 的 `ROLE_PERMISSIONS` 對應角色加入這個 key
3. 更新 `prisma/seed.ts` 的 `PERMISSIONS_BY_ROLE`（同步 seed 進 DB）
4. 跑 `npm run db:seed` 重新匯入
5. 在 server action 開頭呼叫 `await requirePermission("reaction.delete")`

## 加新角色

1. 在 `@/modules/auth/types.ts` 的 `Role` 聯合加新名字
2. 更新所有 4 個地方（見 auth/README）
3. `npm run db:seed`

## Phase 進度

- ✅ **Phase B** `requirePermission` 真實 async 檢查
- ⬜ Phase F 申請審批工作流的 server actions（核准/拒絕）
- ⬜ Phase F+ 細粒度資料層級權限（例如「只能編輯自己的文章」）——已透過 `authorId` 為 row-level 預留欄位
