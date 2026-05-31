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
import { listRecentReminders } from "@/modules/core/reminders";
import { db } from "@/lib/db";
import { GenerateInviteButtons } from "./GenerateInviteButtons";
import { RoleSelect } from "./RoleSelect";
import { RunRemindersButton } from "./RunRemindersButton";
import { InviteGrantToggle } from "./InviteGrantToggle";
import { DeleteUserButton } from "./DeleteUserButton";

export default async function AdminPage() {
  const me = await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");
  if (!isAdmin) redirect("/app/feed?denied=admin");

  const [invites, members, decided, recentReminders, allInviteGrants] = await Promise.all([
    listInviteCodesDb(),
    listAllMembersDb(),
    listDecidedRequestsDb(),
    listRecentReminders(8),
    // Surface who has been granted `invite.create` so we can show the
    // current toggle state without a per-row roundtrip.
    db.userPermissionGrant.findMany({
      where: { permissionKey: "invite.create" },
      select: { userId: true },
    }),
  ]);
  const inviteGrantSet = new Set(allInviteGrants.map((g) => g.userId));

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
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {m.id === me.id ? (
                  <span className="text-xs text-ink/50 flex items-center gap-2">
                    <RoleBadge role={m.role} size="xs" /> （你自己）
                  </span>
                ) : (
                  <>
                    <RoleSelect userId={m.id} current={m.role} />
                    {/* invite.create grant is meaningless when role already
                        has it (Editor / Admin) — only surface for Guest /
                        Member where it's a real delegation. */}
                    {(m.role === "Guest" || m.role === "Member") && (
                      <InviteGrantToggle
                        userId={m.id}
                        granted={inviteGrantSet.has(m.id)}
                      />
                    )}
                    <DeleteUserButton userId={m.id} name={m.name} />
                  </>
                )}
              </div>
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

      {/* Activity reminder cron */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">⏰ 活動行前提醒</h2>
        <p className="text-sm text-ink/60 mb-4">
          發送「明天有 X」（24h 前）和「快開始了」（2h 前）兩種通知給 GOING 的人。
          自動排程接 <code className="text-terracotta">/api/cron/reminders</code>，或在這手動觸發。
        </p>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 mb-4">
          <RunRemindersButton />
          <p className="text-xs text-ink/50 mt-3 leading-relaxed">
            生產環境：在你的 cron 服務（系統 crontab / Vercel cron / GitHub Actions）每 15 分鐘打一次{" "}
            <code className="text-terracotta bg-cream/60 px-1 rounded">POST /api/cron/reminders</code>，
            帶 <code className="text-terracotta bg-cream/60 px-1 rounded">Authorization: Bearer $CRON_SECRET</code>{" "}
            header。每筆活動每個 tier 只會發一次（唯一索引保護）。
          </p>
        </div>

        <h3 className="text-sm font-medium text-ink/75 mb-2">最近發送的提醒</h3>
        <div className="bg-white rounded-soft border border-sand/60 overflow-hidden">
          {recentReminders.length === 0 ? (
            <p className="text-sm text-ink/55 italic px-4 py-6">尚未有任何發送紀錄。</p>
          ) : (
            <div className="divide-y divide-sand">
              {recentReminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    r.tier === "DAY_BEFORE"
                      ? "bg-sage-soft/60 text-sage-dark"
                      : "bg-terracotta-soft/60 text-terracotta-dark"
                  }`}>
                    {r.tier === "DAY_BEFORE" ? "24h 前" : "2h 前"}
                  </span>
                  <span className="text-ink truncate flex-1">{r.activityTitle}</span>
                  <span className="text-xs text-ink/55 tabular-nums">通知 {r.notifiedUserCount} 人</span>
                  <span className="text-xs text-ink/40 tabular-nums">
                    {new Date(r.sentAt).toLocaleString("zh-TW", { hour12: false })}
                  </span>
                </div>
              ))}
            </div>
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
