import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { db } from "@/lib/db";
import { GenerateInviteButtons } from "../admin/GenerateInviteButtons";
import { InviteEditControls } from "./InviteEditControls";

/**
 * Personal invite manager for any user who holds `invite.create`.
 *
 * Admins also have a full invite list in /app/admin, but for non-admin
 * users this is their dedicated entry point.
 *
 * Shows only THIS user's own invites — admins seeing every code is a
 * /app/admin concern.
 */
export default async function InvitesPage() {
  const me = await requireCurrentUser();
  const [canInvite, canGrantAdmin] = await Promise.all([
    canCurrentUser("invite.create"),
    canCurrentUser("admin.approve"),
  ]);
  if (!canInvite) redirect("/app/feed?denied=invite");

  const mine = await db.inviteCode.findMany({
    where: { createdById: me.id },
    orderBy: { createdAt: "desc" },
    include: { usedBy: true, defaultRole: true },
    take: 50,
  });

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">INVITES</p>
        <h1 className="serif text-3xl text-ink">邀請朋友加入</h1>
        <p className="text-ink/60 text-sm mt-1 leading-relaxed">
          產生一個邀請碼，把它傳給家人朋友（LINE / 訊息 / 私下都可）。
          每個碼只能用一次，對方輸入後會建立屬於自己的帳號。
        </p>
      </div>

      <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 mb-6">
        <GenerateInviteButtons />
        <p className="text-xs text-ink/45 mt-3 leading-relaxed">
          收到碼的人到 <Link href="/login" className="text-terracotta hover:underline">/login</Link> 輸入，
          完成個人設定（名字 / 頭像）後就能用了。
        </p>
      </div>

      <h2 className="serif text-lg text-ink mb-3">我發出的邀請碼</h2>
      {mine.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border border-sand p-6 text-sm text-ink/55 text-center">
          還沒有邀請碼。用上方按鈕產生一個吧。
        </div>
      ) : (
        <div className="bg-white rounded-soft border border-sand/60 overflow-hidden divide-y divide-sand">
          {mine.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <code className="font-mono text-terracotta-dark bg-terracotta-soft/30 px-2 py-1 rounded">
                {c.code}
              </code>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream text-ink/65 font-medium">
                預設角色 {c.defaultRole.name}
              </span>
              <span className="ml-auto text-xs text-ink/50">
                {c.usedById ? (
                  <span className="text-sage-dark">✓ 已被 {c.usedBy?.name ?? "新用戶"} 使用</span>
                ) : (
                  <span className="text-sage-dark">● 永久有效（未使用）</span>
                )}
              </span>
              {!c.usedById && (
                <InviteEditControls
                  code={c.code}
                  currentRole={c.defaultRole.name as "Guest" | "Member" | "Editor" | "Admin"}
                  canGrantAdmin={canGrantAdmin}
                />
              )}
              <span className="text-[10px] text-ink/40 tabular-nums">
                {new Date(c.createdAt).toLocaleDateString("zh-TW")}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        每個邀請碼只能被使用一次，但<strong>在被使用之前永久有效</strong>——就算系統更新或重新部署也不會失效或消失。收到碼的人輸入後會自動建立屬於自己的帳號，並走完<Link href="/app/setup" className="text-terracotta hover:underline">個人設定</Link>。
      </div>
    </main>
  );
}
