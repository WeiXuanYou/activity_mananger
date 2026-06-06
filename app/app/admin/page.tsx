import Link from "next/link";
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
import { countOpenFeedbackDb } from "@/modules/feedback";
import { db } from "@/lib/db";
import { GenerateInviteButtons } from "./GenerateInviteButtons";
import { RoleSelect } from "./RoleSelect";
import { RunRemindersButton } from "./RunRemindersButton";
import { InviteGrantToggle } from "./InviteGrantToggle";
import { DeleteUserButton } from "./DeleteUserButton";
import { InviteEditControls } from "../invites/InviteEditControls";

export default async function AdminPage() {
  const me = await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");
  if (!isAdmin) redirect("/app/feed?denied=admin");

  const [invites, members, decided, recentReminders, inviteDenies, openFeedback] = await Promise.all([
    listInviteCodesDb(),
    listAllMembersDb(),
    listDecidedRequestsDb(),
    listRecentReminders(8),
    // Members can invite by default now; surface who has been DENIED so the
    // toggle shows the right state. (deny key = "invite.create:deny")
    db.userPermissionGrant.findMany({
      where: { permissionKey: "invite.create:deny" },
      select: { userId: true },
    }),
    countOpenFeedbackDb(),
  ]);
  const inviteDeniedSet = new Set(inviteDenies.map((g) => g.userId));

  // Deployment config status — surfaces the env settings whose absence
  // causes the most common "X doesn't work in production" reports.
  const config = {
    appUrl: Boolean(process.env.APP_URL?.trim()),
    mail: Boolean(process.env.RESEND_API_KEY?.trim()),
    uploadsDir: Boolean(process.env.UPLOADS_DIR?.trim()),
    push: Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()),
  };

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-ink text-white px-2 py-0.5 rounded-full">ADMIN</span>
        <p className="text-sage-dark text-xs font-medium tracking-widest">MANAGEMENT TOOLS</p>
      </div>
      <h1 className="serif text-3xl text-ink mb-8">管理工具</h1>

      {/* Deployment config status */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">⚙️ 部署設定檢查</h2>
        <p className="text-sm text-ink/60 mb-4">
          這些環境變數沒設好，是「功能在正式站壞掉」最常見的原因。在 <code className="text-terracotta">.env</code> 設定後重新部署即可。
        </p>
        <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand text-sm">
          <ConfigRow ok={config.appUrl} label="APP_URL（公開網址）"
            okHint="Email 連結會指向正確網址" badHint="未設 → 驗證信 / 重設密碼信的連結可能指向 localhost 或內部主機，使用者點不到" />
          <ConfigRow ok={config.mail} label="RESEND_API_KEY（寄信）"
            okHint="會寄出真的 Email" badHint="未設 → 驗證信 / 重設密碼信只印在伺服器 log，不會真的寄出" />
          <ConfigRow ok={config.uploadsDir} label="UPLOADS_DIR（圖片存放）"
            okHint="圖片存到指定持久磁碟" badHint="未設 → 存在 public/uploads，容器 / Serverless 上重新部署可能消失或無法顯示" />
          <ConfigRow ok={config.push} label="VAPID 金鑰（推播通知）"
            okHint="可開啟手機推播" badHint="未設 → 推播停用（站內鈴鐺仍正常）；跑 npm run gen-vapid 產生" />
        </div>
      </section>

      {/* Feedback inbox shortcut */}
      <section className="mb-10">
        <Link
          href="/app/admin/feedback"
          className="block bg-white rounded-soft shadow-card border border-sand/60 p-5 hover:shadow-soft transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📨</span>
            <div className="flex-1">
              <div className="serif text-lg text-ink flex items-center gap-2">
                意見回饋
                {openFeedback > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-terracotta text-white">{openFeedback} 待處理</span>
                )}
              </div>
              <p className="text-sm text-ink/60">查看成員送出的問題、建議與提問。</p>
            </div>
            <span className="text-ink/40">→</span>
          </div>
        </Link>
      </section>

      {/* Data backup */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">💾 資料備份</h2>
        <p className="text-sm text-ink/60 mb-4">
          一鍵下載整個資料庫的 JSON 備份（所有用戶、貼文、活動、留言…）。建議定期下載存檔，
          萬一伺服器出問題也能還原。
        </p>
        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
          <a
            href="/api/admin/backup"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            ⬇ 下載完整備份（JSON）
          </a>
          <p className="text-xs text-ink/45 mt-3 leading-relaxed">
            備份檔包含密碼雜湊與 session token，請妥善保管、不要外流。
            還原可搭配 <code className="text-terracotta bg-cream/60 px-1 rounded">npm run db:import-json</code>。
          </p>
        </div>
      </section>

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
              <span className="ml-auto flex items-center gap-2">
                {!inv.used && (
                  <InviteEditControls
                    code={inv.code}
                    currentRole={inv.roleName as "Guest" | "Member" | "Editor" | "Admin"}
                    canGrantAdmin
                  />
                )}
                <span className="text-xs text-ink/40">
                  {new Date(inv.createdAt).toLocaleDateString("zh-TW")}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Role management */}
      <section className="mb-10">
        <h2 className="serif text-xl text-ink mb-1">👥 成員角色</h2>
        <p className="text-sm text-ink/60 mb-3">直接調整成員角色（繞過申請流程）。改完會通知該成員。</p>
        <p className="text-xs text-sage-dark bg-sage-soft/30 border border-sage/30 rounded-soft px-3 py-2 mb-4 flex items-start gap-2">
          <span>🔒</span>
          <span><strong>admin</strong> 是系統保留帳號，永遠存在 · 角色固定為 Admin、不能刪除、不能改 handle。其他欄位（名字 / 頭像 / Email / 密碼）一樣可以自由更改。</span>
        </p>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
          {members.map((m) => {
            // The bootstrap admin row is protected at the server-action
            // layer (see modules/permissions/admin.ts and
            // modules/auth/actions.ts). Mirror that here so the operator
            // sees WHY the controls are disabled instead of clicking and
            // bouncing off an error alert.
            const isReserved = m.handle === "admin";
            return (
              <div key={m.id} className="p-3 flex items-center gap-3">
                <Avatar member={m} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink flex items-center gap-2 flex-wrap">
                    <span>{m.name}</span>
                    {isReserved && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage-soft/40 text-sage-dark font-medium"
                        title="系統保留帳號，不能刪除或降權"
                      >
                        🔒 系統保留
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink/40">@{m.handle}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {m.id === me.id ? (
                    <span className="text-xs text-ink/50 flex items-center gap-2">
                      <RoleBadge role={m.role} size="xs" /> （你自己）
                    </span>
                  ) : (
                    <>
                      <RoleSelect userId={m.id} current={m.role} disabled={isReserved} />
                      {/* Members can invite by default; the toggle lets an
                          admin turn it OFF for this person. Editor/Admin always
                          can invite (and aren't shown a toggle). Guests don't
                          have the Member role default, but admins can still
                          allow them here. */}
                      {(m.role === "Guest" || m.role === "Member") && (
                        <InviteGrantToggle
                          userId={m.id}
                          allowed={m.role === "Member" && !inviteDeniedSet.has(m.id)}
                        />
                      )}
                      {isReserved ? (
                        <span
                          className="text-xs px-2 py-1 rounded-soft bg-cream/40 border border-sand text-ink/40 cursor-not-allowed"
                          title="admin 是系統保留帳號，不能刪除"
                        >
                          🔒 不可刪除
                        </span>
                      ) : (
                        <DeleteUserButton userId={m.id} name={m.name} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
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

function ConfigRow({ ok, label, okHint, badHint }: { ok: boolean; label: string; okHint: string; badHint: string }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <span className={`shrink-0 mt-0.5 ${ok ? "text-sage-dark" : "text-terracotta-dark"}`}>
        {ok ? "✅" : "⚠️"}
      </span>
      <div className="min-w-0">
        <div className="text-ink font-medium">{label}</div>
        <div className={`text-xs mt-0.5 ${ok ? "text-ink/55" : "text-terracotta-dark"}`}>
          {ok ? okHint : badHint}
        </div>
      </div>
    </div>
  );
}
