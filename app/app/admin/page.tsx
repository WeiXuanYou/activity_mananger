import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import {
  canCurrentUser,
  RoleBadge,
  listInviteCodesDb,
  listAllMembersDb,
  listDecidedRequestsDb,
} from "@/modules/permissions";
import { Avatar } from "@/modules/core/members";
import { GenerateInviteButtons } from "./GenerateInviteButtons";
import { RoleSelect } from "./RoleSelect";

export default async function AdminPage() {
  const me = await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");
  if (!isAdmin) redirect("/app/feed?denied=admin");

  const [invites, members, decided] = await Promise.all([
    listInviteCodesDb(),
    listAllMembersDb(),
    listDecidedRequestsDb(),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-ink text-white px-2 py-0.5 rounded-full">ADMIN</span>
        <p className="text-sage-dark text-xs font-medium tracking-widest">MANAGEMENT TOOLS</p>
      </div>
      <h1 className="serif text-3xl text-ink mb-8">管理工具</h1>

      {/* Invite codes */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">🎟 邀請碼</h2>
        <p className="text-sm text-ink/60 mb-4">產生新邀請碼給家人朋友。對方用邀請碼登入後即取得對應角色。</p>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 mb-4">
          <GenerateInviteButtons />
        </div>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
          {invites.map((inv) => (
            <div key={inv.code} className="p-3 flex items-center gap-3 text-sm">
              <code className="font-mono text-ink bg-cream/50 px-2 py-1 rounded">{inv.code}</code>
              <RoleBadge role={inv.roleName as "Guest" | "Member" | "Editor" | "Admin"} size="xs" />
              {inv.used ? (
                <span className="text-xs text-ink/50">已被 {inv.usedByName ?? "某人"} 使用</span>
              ) : (
                <span className="text-xs text-sage-dark">● 可用</span>
              )}
              <span className="ml-auto text-xs text-ink/40">
                {new Date(inv.createdAt).toLocaleDateString("zh-TW")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Role management */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">👥 成員角色</h2>
        <p className="text-sm text-ink/60 mb-4">直接調整成員角色（繞過申請流程）。改完會通知該成員。</p>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
          {members.map((m) => (
            <div key={m.id} className="p-3 flex items-center gap-3">
              <Avatar member={m} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink">{m.name}</div>
                <div className="text-xs text-ink/40">@{m.handle}</div>
              </div>
              {m.id === me.id ? (
                <span className="text-xs text-ink/50 flex items-center gap-2">
                  <RoleBadge role={m.role} size="xs" /> （你自己）
                </span>
              ) : (
                <RoleSelect userId={m.id} current={m.role} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Audit log */}
      <section>
        <h2 className="serif text-xl text-ink mb-1">📋 審計日誌</h2>
        <p className="text-sm text-ink/60 mb-4">已處理的權限申請紀錄（永久保留）。</p>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
          {decided.length === 0 ? (
            <div className="p-4 text-sm text-ink/50">尚無已處理紀錄</div>
          ) : (
            decided.map((r) => (
              <div key={r.id} className="p-3 flex items-center gap-3 text-sm">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "APPROVED" ? "bg-sage-soft text-sage-dark" : "bg-terracotta-soft text-terracotta-dark"
                }`}>
                  {r.status === "APPROVED" ? "核准" : "拒絕"}
                </span>
                <span className="text-ink/70">{r.currentRole} → {r.requestedRole}</span>
                <span className="text-ink/50 truncate flex-1">「{r.reason}」</span>
                <span className="text-xs text-ink/40">{r.createdAt}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        本頁所有動作都過 <code className="text-terracotta">requirePermission("admin.approve" / "invite.create")</code>。
        非 Admin 直接被重導離開。
      </div>
    </main>
  );
}
