import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, signOutAction } from "@/modules/auth";
import { Avatar } from "@/modules/core/members";
import { RoleBadge, canCurrentUser } from "@/modules/permissions";
import { NotificationBell, unreadCountDb } from "@/modules/notifications";

/**
 * Authenticated shell for the REAL app (Phase B+).
 * Requires a valid session; otherwise redirects to /login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Adapt DB user shape to the Member shape Avatar expects
  const me = {
    id: user.id,
    name: user.name,
    handle: user.handle,
    role: user.role.name as "Guest" | "Member" | "Editor" | "Admin",
    avatarColor: user.avatarColor,
    initial: user.initial,
  };

  const [unread, isAdmin] = await Promise.all([
    unreadCountDb(user.id),
    canCurrentUser("admin.approve"),
  ]);

  return (
    <div>
      <header className="border-b border-sand bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link href="/app/feed" className="serif text-2xl text-terracotta font-semibold flex items-baseline gap-2 shrink-0">
            <span>相聚</span>
            <span className="text-xs text-ink/40 font-sans tracking-widest">Together</span>
          </Link>
          <span className="hidden lg:inline text-xs bg-sage-soft/60 text-sage-dark px-2 py-1 rounded-full font-medium">
            ● Phase F+G
          </span>
          <nav className="hidden md:flex items-center gap-1 ml-1 overflow-x-auto">
            <Link href="/app/feed" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">動態</Link>
            <Link href="/app/activities" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">活動</Link>
            <Link href="/app/pages" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">頁面</Link>
            <Link href="/app/assistant" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">✨ AI</Link>
            <Link href="/app/permissions" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">權限</Link>
            <Link href="/app/analytics" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">分析</Link>
            {isAdmin && (
              <Link href="/app/admin" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">管理</Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <NotificationBell unread={unread} />
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Avatar member={me} size={32} />
              <span className="font-medium text-ink/80">{me.name}</span>
              <RoleBadge role={me.role} />
            </div>
            <form action={signOutAction}>
              <button className="text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40">
                登出
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
