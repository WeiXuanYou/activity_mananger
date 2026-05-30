"use client";
/**
 * Slide-in mobile nav drawer. The desktop nav (md:flex) is hidden
 * <md; this component takes over with a hamburger button that opens a
 * full-height side sheet.
 *
 * Drawer contents = exactly what the desktop nav shows, plus the
 * profile + 登出 row that was floating in the desktop header.
 *
 * One scrolllock-while-open. Backdrop click + ESC close.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function MobileMenu({
  profileHref,
  myName,
  myRole,
  isAdmin,
  canInvite,
  onSignOut,
}: {
  profileHref: string;
  myName: string;
  myRole: string;
  isAdmin: boolean;
  canInvite: boolean;
  /** Server action passed in from the layout (signOutAction). */
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();

  // Auto-close when navigating to a new route (clicking a link inside).
  // Track path; close on change.
  useEffect(() => { setOpen(false); }, [path]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const link = "block px-4 py-3 rounded-soft text-base text-ink hover:bg-cream/60 transition";
  const smallLink = "block px-4 py-2 rounded-soft text-sm text-ink/70 hover:bg-cream/60 transition";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="開啟選單"
        className="md:hidden w-10 h-10 rounded-soft hover:bg-cream/60 flex items-center justify-center text-2xl leading-none"
      >
        ☰
      </button>

      {open && (
        <div
          className="md:hidden fixed top-0 left-0 z-50 flex"
          style={{ width: "100vw", height: "100vh" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sheet — inline-height to dodge cases where Tailwind's
              h-screen / flex-stretch leave the wrapper at content height */}
          <aside
            className="relative ml-auto w-[85%] max-w-sm bg-cream shadow-soft overflow-y-auto flex flex-col"
            style={{ height: "100vh" }}
            role="dialog"
            aria-label="選單"
          >
            {/* Header inside drawer */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-sand">
              <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-medium text-sm shrink-0">
                  {myName[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{myName}</div>
                  <div className="text-[10px] text-ink/55">{myRole}</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="關閉"
                className="w-9 h-9 rounded-soft hover:bg-sand/60 text-xl text-ink/60"
              >
                ✕
              </button>
            </div>

            {/* Primary nav */}
            <nav className="px-2 py-3 space-y-0.5">
              <Link href="/app/feed" className={link}>📰 動態</Link>
              <Link href="/app/activities" className={link}>🍖 活動</Link>
              <Link href="/app/calendar" className={link}>📅 行事曆</Link>
              <Link href="/app/pages" className={link}>📄 頁面</Link>
              <Link href="/app/search" className={link}>🔍 搜尋</Link>
              <Link href="/app/assistant" className={link}>✨ AI 助手</Link>
              <Link href="/app/notifications" className={link}>🔔 通知</Link>
              <Link href="/app/permissions" className={link}>🔐 權限</Link>
              {canInvite && <Link href="/app/invites" className={link}>🎁 邀請朋友</Link>}
              <Link href="/app/analytics" className={link}>📊 分析</Link>
              {isAdmin && <Link href="/app/admin" className={link}>⚙️ 管理</Link>}
              <Link href="/app/help" className={link}>❓ 使用說明</Link>
            </nav>

            <div className="px-2 pt-2 mt-1 border-t border-sand">
              <div className="px-4 py-2 text-xs text-ink/40 font-medium tracking-wider">建立</div>
              <Link href="/app/activities/new" className={smallLink}>🍖 活動</Link>
              <Link href="/app/polls/new" className={smallLink}>📊 投票</Link>
            </div>

            {/* Footer actions */}
            <div className="mt-auto px-2 py-3 border-t border-sand space-y-0.5">
              <Link href="/preview" className={smallLink}>🖼 全站預覽</Link>
              <form
                action={async () => {
                  await onSignOut();
                  router.push("/login");
                }}
              >
                <button
                  type="submit"
                  className="block w-full text-left px-4 py-2.5 rounded-soft text-sm text-terracotta-dark hover:bg-terracotta-soft/40 transition"
                >
                  登出
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
