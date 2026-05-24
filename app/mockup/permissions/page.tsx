import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { permissionRequests, findMember } from "../_data";

const roles = [
  {
    name: "Guest",
    color: "bg-sand text-ink/70",
    perms: ["讀取公開內容"],
  },
  {
    name: "Member",
    color: "bg-sage-soft text-sage-dark",
    perms: ["讀取所有 PUBLIC / MEMBERS", "發文、按讚、留言", "投票、RSVP", "建立自己的自訂頁面"],
  },
  {
    name: "Editor",
    color: "bg-terracotta-soft text-terracotta-dark",
    perms: ["所有 Member 權限", "建立活動與投票", "置頂內容、審查留言"],
  },
  {
    name: "Admin",
    color: "bg-ink text-white",
    perms: ["所有 Editor 權限", "管理角色與權限", "發出邀請碼", "查看分析儀表板"],
  },
];

export default function PermissionsMockup() {
  const myHistory = permissionRequests.filter((r) => r.userId === "u2" || r.userId === "u3");

  return (
    <main>
      <MockNav active="/mockup/permissions" />
      <div className="max-w-4xl mx-auto px-5 py-8">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">PERMISSIONS</p>
        <h1 className="serif text-3xl text-ink mb-2">申請更高權限</h1>
        <p className="text-ink/60 mb-8">
          你目前是 <span className="inline-block px-2 py-0.5 rounded-full bg-sage-soft text-sage-dark text-xs font-medium ml-1">Member</span>
          ——可以發文、按讚、投票、留言。如果你想要建立活動或投票，需要升級為 Editor。
        </p>

        {/* Role overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {roles.map((r) => (
            <div key={r.name} className="bg-white rounded-soft shadow-card border border-sand/60 p-4">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${r.color}`}>
                {r.name}
              </span>
              <ul className="space-y-1.5 text-sm text-ink/75">
                {r.perms.map((p) => (
                  <li key={p} className="flex gap-1.5">
                    <span className="text-sage-dark shrink-0">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Request form */}
        <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 mb-8">
          <h2 className="serif text-2xl text-ink mb-1">提出申請</h2>
          <p className="text-sm text-ink/60 mb-5">由管理員（阿嬤、媽媽）審核——通常 1-2 天內回覆。</p>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink/80">目標權限</span>
              <select className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta">
                <option>Editor — 可建立活動與投票</option>
                <option>Admin — 可管理整個系統（需要更詳細的理由）</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink/80">申請理由</span>
              <textarea
                placeholder="請簡單說明你想要這個權限的原因，例如：「我想幫忙籌備中秋活動，需要建立活動和投票」"
                className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
                rows={4}
                defaultValue="想要幫忙整理週末家族活動，需要能建立活動和發起投票收集大家的意見。"
              />
            </label>

            <div className="flex items-center gap-3 pt-3 border-t border-sand">
              <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
                送出申請
              </button>
              <span className="text-xs text-ink/50">申請紀錄會永久保存（審計用）</span>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="serif text-xl text-ink mb-3">我的申請紀錄</h2>
          <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
            {myHistory.map((r) => {
              const statusColor = {
                PENDING: "bg-cream text-ink/70",
                APPROVED: "bg-sage-soft text-sage-dark",
                REJECTED: "bg-terracotta-soft text-terracotta-dark",
              }[r.status];
              const statusText = { PENDING: "審核中", APPROVED: "已核准", REJECTED: "未通過" }[r.status];
              return (
                <div key={r.id} className="p-4 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-ink">
                        {r.currentRole} → {r.requestedRole}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
                    </div>
                    <p className="text-sm text-ink/70 mb-1">{r.reason}</p>
                    <span className="text-xs text-ink/40">{r.createdAt}</span>
                  </div>
                </div>
              );
            })}
            {myHistory.length === 0 && (
              <div className="p-6 text-center text-sm text-ink/50">尚無申請紀錄</div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-5">
          <p className="text-xs text-ink/60 leading-relaxed">
            <strong className="text-ink/80">關於權限系統：</strong>
            所有權限檢查都在 server-side 的 <code className="text-terracotta">requirePermission()</code> 通道——
            每個能寫入或讀取非公開資料的動作都會經過它。
            申請流程記錄於 <code className="text-terracotta">PermissionRequest</code> 表，永不刪除，方便日後審計。
          </p>
        </div>
      </div>
    </main>
  );
}
