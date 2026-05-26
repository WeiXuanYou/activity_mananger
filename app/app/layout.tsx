import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, signOutAction } from "@/modules/auth";
import { Avatar } from "@/modules/core/members";
import { RoleBadge } from "@/modules/permissions";

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

  return (
    <div>
      <header className="border-b border-sand bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link href="/app/feed" className="serif text-2xl text-terracotta font-semibold flex items-baseline gap-2">
            <span>相聚</span>
            <span className="text-xs text-ink/40 font-sans tracking-widest">Together</span>
          </Link>
          <span className="text-xs bg-sage-soft/60 text-sage-dark px-2 py-1 rounded-full font-medium">
            ● Phase C · Live DB
          </span>
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <Link href="/app/feed" className="px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">動態</Link>
            <Link href="/app/activities" className="px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">活動</Link>
            <Link href="/app/posts/new" className="px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">建立</Link>
            <Link href="/app/permissions" className="px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">權限</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
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
