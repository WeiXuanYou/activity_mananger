import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import { Avatar, findMember } from "@/modules/core/members";
import { listDecidedRequests, listPendingRequests, RoleBadge } from "@/modules/permissions";

export default function InboxMockup() {
  const pending = listPendingRequests();
  const decided = listDecidedRequests();

  return (
    <main>
      <MockNav />
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs bg-ink text-white px-2 py-1 rounded-full font-medium">ADMIN</span>
          <p className="text-sage-dark text-xs font-medium tracking-widest">PERMISSION INBOX</p>
        </div>
        <h1 className="serif text-3xl text-ink mb-2">權限申請審批</h1>
        <p className="text-ink/60 mb-8">{pending.length} 筆待處理 · {decided.length} 筆歷史紀錄</p>

        <section className="mb-10">
          <h2 className="serif text-xl text-ink mb-3 flex items-center gap-2">
            待處理
            <span className="text-xs bg-terracotta text-white px-2 py-0.5 rounded-full">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map((r) => {
              const user = findMember(r.userId);
              return (
                <div key={r.id} className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
                  <div className="flex items-start gap-4">
                    <Avatar member={user} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-ink">{user.name}</span>
                        <span className="text-xs text-ink/40">@{user.handle}</span>
                        <span className="text-xs text-ink/60">想升級為</span>
                        <RoleBadge role={r.requestedRole} />
                        <span className="text-xs text-ink/40 ml-auto">{r.createdAt}</span>
                      </div>
                      <p className="text-sm text-ink/75 bg-cream/40 rounded-soft p-3 mt-2 mb-3 leading-relaxed">
                        「{r.reason}」
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 rounded-soft bg-sage text-white font-medium text-sm hover:bg-sage-dark transition">
                          ✓ 核准
                        </button>
                        <button className="px-4 py-2 rounded-soft bg-white border border-sand text-ink/70 text-sm hover:bg-cream/40">
                          ✕ 拒絕
                        </button>
                        <button className="px-4 py-2 rounded-soft bg-white border border-sand text-ink/70 text-sm hover:bg-cream/40">
                          💬 詢問
                        </button>
                        <Link href="/mockup/profile" className="ml-auto text-xs text-ink/50 hover:text-terracotta self-center">
                          查看完整檔案 →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="serif text-xl text-ink mb-3">已處理</h2>
          <div className="bg-white rounded-soft shadow-card border border-sand/60 divide-y divide-sand">
            {decided.map((r) => {
              const user = findMember(r.userId);
              return (
                <div key={r.id} className="p-4 flex items-center gap-3">
                  <Avatar member={user} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-ink">{user.name}</span>
                      <span className="text-ink/60"> · {r.currentRole} → {r.requestedRole}</span>
                    </div>
                    <div className="text-xs text-ink/50 truncate">{r.reason}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === "APPROVED" ? "bg-sage-soft text-sage-dark" : "bg-terracotta-soft text-terracotta-dark"
                  }`}>
                    {r.status === "APPROVED" ? "已核准" : "已拒絕"}
                  </span>
                  <span className="text-xs text-ink/40 ml-3">{r.createdAt}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-lg text-ink mb-2">🎟 邀請碼</h3>
            <p className="text-xs text-ink/60 mb-3">產生新邀請碼給家人朋友（管理員專屬）</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-cream/50 rounded-soft border border-sand font-mono text-sm">
                TOGETHER-2026-XXXX
              </code>
              <button className="px-3 py-2 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark">
                產生
              </button>
            </div>
          </div>
          <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
            <h3 className="serif text-lg text-ink mb-2">📋 審計日誌</h3>
            <p className="text-xs text-ink/60">所有權限變更永久保留，便於追溯。</p>
            <a href="#" className="text-sm text-terracotta hover:underline mt-2 inline-block">查看完整日誌 →</a>
          </div>
        </div>
      </div>
    </main>
  );
}
