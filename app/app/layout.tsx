import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, signOutAction } from "@/modules/auth";
import { Avatar } from "@/modules/core/members";
import { RoleBadge, canCurrentUser } from "@/modules/permissions";
import { NotificationBell, unreadCountDb } from "@/modules/notifications";
import { SearchBar } from "./search/SearchBar";
import { MobileMenu } from "./MobileMenu";
import { PwaShell } from "./PwaShell";
import { SetupForm } from "./setup/SetupForm";

/**
 * Authenticated shell for the REAL app (Phase B+).
 * Requires a valid session; otherwise redirects to /login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // First-time users see the setup form INSTEAD of the requested page
  // until they complete it. We render-in-place rather than redirect:
  // an HTTP redirect from a layout gets cached by Next's RSC client and
  // causes an infinite navigation loop when the destination is itself
  // inside the same layout. Rendering in place keeps the URL stable AND
  // forces a real render every time, no cache shenanigans.
  if (!user.setupCompleted) {
    return (
      <main className="max-w-xl mx-auto px-3 sm:px-5 py-8 sm:py-12">
        <div className="mb-6 text-center">
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">SET UP YOUR PROFILE</p>
          <h1 className="serif text-3xl text-ink mb-2">先簡單設定一下</h1>
          <p className="text-ink/65 text-sm leading-relaxed">
            歡迎加入相聚！告訴大家你想顯示的名字、用什麼顏色當頭像。設定完就能開始發文、辦活動。
          </p>
        </div>
        <SetupForm
          initial={{
            name: user.name === "新成員" || user.name === "Admin" ? "" : user.name,
            // The bootstrap admin keeps `handle: "admin"` (reserved, can't
            // be renamed — see enforceBootstrapAdminHandle in
            // modules/auth/actions.ts). Show it pre-filled so the user
            // knows it's locked rather than yanking it out and asking
            // them to type something the server will then reject.
            handle: user.handle,
            initial: "",
            avatarColor: user.avatarColor,
            avatarImage: user.avatarImage ?? null,
            email: user.email ?? null,
            birthday: null,
          }}
          /* Force password rotation if the user already has a password set —
             that means they're the bootstrap admin (only path that ships
             with a password but setupCompleted=false). */
          mustResetPassword={Boolean(user.passwordHash)}
          handleLocked={user.handle === "admin"}
        />
      </main>
    );
  }

  // Adapt DB user shape to the Member shape Avatar expects
  const me = {
    id: user.id,
    name: user.name,
    handle: user.handle,
    role: user.role.name as "Guest" | "Member" | "Editor" | "Admin",
    avatarColor: user.avatarColor,
    initial: user.initial,
    avatarImage: user.avatarImage ?? null,
  };

  const [unread, isAdmin, canInvite] = await Promise.all([
    unreadCountDb(user.id),
    canCurrentUser("admin.approve"),
    canCurrentUser("invite.create"),
  ]);

  return (
    <div>
      <header className="border-b border-sand bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 md:px-5 py-2.5 md:py-3 flex items-center gap-2 md:gap-4">
          <Link href="/app/feed" className="serif text-xl md:text-2xl text-terracotta font-semibold flex items-baseline gap-2 shrink-0">
            <span>相聚</span>
            <span className="hidden sm:inline text-xs text-ink/40 font-sans tracking-widest">Together</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-1 overflow-x-auto">
            <Link href="/app/feed" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">動態</Link>
            <Link href="/app/activities" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">活動</Link>
            <Link href="/app/calendar" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">行事曆</Link>
            <Link href="/app/lodging" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">住宿</Link>
            <Link href="/app/pages" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">頁面</Link>
            <Link href="/app/assistant" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">✨ AI</Link>
            <Link href="/app/permissions" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">權限</Link>
            {canInvite && (
              <Link href="/app/invites" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">邀請</Link>
            )}
            <Link href="/app/analytics" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">分析</Link>
            {isAdmin && (
              <Link href="/app/admin" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">管理</Link>
            )}
            <Link href="/app/feedback" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">回饋</Link>
            <Link href="/app/help" className="shrink-0 px-3 py-1.5 rounded-soft text-sm text-ink/70 hover:bg-sand/60">說明</Link>
            {/* 建立：文章在動態頁面上方已有「+ 寫一篇文章」按鈕，這裡只放活動 / 投票 */}
            <span className="shrink-0 ml-2 text-xs text-ink/40">建立：</span>
            <Link href="/app/activities/new" className="shrink-0 px-2 py-1 rounded text-xs text-ink/65 hover:bg-sand/60">活動</Link>
            <Link href="/app/polls/new" className="shrink-0 px-2 py-1 rounded text-xs text-ink/65 hover:bg-sand/60">投票</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Search: full bar on md+, just an icon on mobile that jumps to the search page */}
            <div className="hidden md:block"><SearchBar compact /></div>
            <Link
              href="/app/search"
              aria-label="搜尋"
              className="md:hidden w-10 h-10 rounded-soft hover:bg-cream/60 flex items-center justify-center text-lg"
            >
              🔍
            </Link>
            <NotificationBell unread={unread} />
            <Link
              href={`/app/members/${user.id}`}
              className="hidden md:flex items-center gap-2 text-sm hover:opacity-80 transition"
              title="去我的個人檔案"
            >
              <Avatar member={me} size={32} />
              <span className="font-medium text-ink/80">{me.name}</span>
              <RoleBadge role={me.role} />
            </Link>
            <Link
              href="/app/account"
              className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40"
              title="改頭像、名字、Email、密碼"
            >
              ⚙ 設定
            </Link>
            <form action={signOutAction} className="hidden md:block">
              <button className="text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40">
                登出
              </button>
            </form>
            <MobileMenu
              profileHref={`/app/members/${user.id}`}
              myName={me.name}
              myRole={me.role}
              isAdmin={isAdmin}
              canInvite={canInvite}
              onSignOut={signOutAction}
            />
          </div>
        </div>
      </header>
      {children}
      <PwaShell />
    </div>
  );
}
