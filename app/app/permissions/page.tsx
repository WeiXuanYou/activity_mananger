import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import {
  ROLE_DESCRIPTIONS,
  RoleBadge,
  canCurrentUser,
  listRequestsByUserDb,
  listPendingRequestsDb,
} from "@/modules/permissions";
import { Avatar, findMembersByIdsDb } from "@/modules/core/members";
import type { Role } from "@/modules/auth";
import { RequestForm } from "./RequestForm";
import { AdminActions } from "./AdminActions";

const ROLE_ORDER: Role[] = ["Guest", "Member", "Editor", "Admin"];

export default async function AppPermissionsPage() {
  const me = await requireCurrentUser();
  const myRole = me.role.name as Role;

  const [isAdmin, myHistory, pending] = await Promise.all([
    canCurrentUser("admin.approve"),
    listRequestsByUserDb(me.id),
    canCurrentUser("admin.approve").then((ok) => (ok ? listPendingRequestsDb() : [])),
  ]);

  // Hydrate the pending requests with member info
  const pendingUsers = await findMembersByIdsDb(pending.map((p) => p.userId));
  const usersById = new Map(pendingUsers.map((u) => [u.id, u]));

  return (
    <main className="max-w-4xl mx-auto px-5 py-8">
      <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">PERMISSIONS · LIVE DB</p>
      <h1 className="serif text-3xl text-ink mb-2">你的權限</h1>
      <p className="text-ink/60 mb-8">
        你目前是 <RoleBadge role={myRole} /> · 你的角色擁有 <strong>{me.role.permissions.length}</strong> 項權限
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {ROLE_ORDER.map((role, i) => {
          const isCurrent = role === myRole;
          return (
            <div
              key={role}
              className={`rounded-soft border p-4 transition relative ${
                isCurrent
                  ? "bg-gradient-to-br from-sage-soft/40 to-cream border-sage shadow-soft"
                  : "bg-white border-sand/60 shadow-card"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2 right-3 bg-sage text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  你目前 ↓
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge role={role} />
                <span className="text-[10px] text-ink/40">Lv. {i}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-ink/75">
                {ROLE_DESCRIPTIONS[role].map((p) => (
                  <li key={p} className="flex gap-1.5">
                    <span className="text-sage-dark shrink-0">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Submit-request form (any role can use, except already-Admin) */}
      {myRole !== "Admin" && (
        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 mb-8">
          <h2 className="serif text-2xl text-ink mb-1">提出申請</h2>
          <p className="text-sm text-ink/60 mb-5">送出後管理員會收到通知。</p>
          <RequestForm currentRole={myRole} />
        </div>
      )}

      {/* User's own history */}
      <div className="mb-8">
        <h2 className="serif text-xl text-ink mb-3">我的申請紀錄</h2>
        {myHistory.length === 0 ? (
          <p className="text-sm text-ink/55 bg-cream/40 border border-sand rounded-soft p-4">
            還沒有申請過權限。
          </p>
        ) : (
          <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
            {myHistory.map((r) => (
              <div key={r.id} className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-ink">
                      {r.currentRole} → {r.requestedRole}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="text-sm text-ink/70 mb-1">「{r.reason}」</p>
                  <span className="text-xs text-ink/40">{r.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin inbox */}
      {isAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-ink text-white px-2 py-0.5 rounded-full">ADMIN</span>
            <h2 className="serif text-xl text-ink">待處理 ({pending.length})</h2>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-ink/55 bg-cream/40 border border-sand rounded-soft p-4">
              沒有待處理的申請 ✨
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => {
                const user = usersById.get(r.userId);
                return (
                  <div key={r.id} className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
                    <div className="flex items-start gap-4">
                      {user && <Avatar member={user} size={44} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {user && <span className="font-medium text-ink">{user.name}</span>}
                          <span className="text-xs text-ink/60">想升級為</span>
                          <RoleBadge role={r.requestedRole} />
                          <span className="text-xs text-ink/40 ml-auto">{r.createdAt}</span>
                        </div>
                        <p className="text-sm text-ink/75 bg-cream/40 rounded-soft p-3 mt-2 mb-3 leading-relaxed">
                          「{r.reason}」
                        </p>
                        <AdminActions requestId={r.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        每個動作都過 <code className="text-terracotta">requirePermission()</code>。
        申請紀錄永久保留在 <code className="text-terracotta">PermissionRequest</code> 表（不刪除，方便審計）。
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    PENDING:  ["bg-cream text-ink/70",                "審核中"],
    APPROVED: ["bg-sage-soft text-sage-dark",         "已核准"],
    REJECTED: ["bg-terracotta-soft text-terracotta-dark", "未通過"],
  };
  const [cls, label] = map[status] ?? ["", status];
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
