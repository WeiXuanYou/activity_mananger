import Link from "next/link";
import { Avatar } from "@/modules/core/members";
import { getCurrentUser } from "@/modules/auth";
import { findNextActivity } from "@/modules/core/activities";
import { formatShortDate } from "@/lib/date";

const links = [
  { href: "/mockup/feed", label: "動態" },
  { href: "/mockup/activities", label: "活動" },
  { href: "/mockup/pages", label: "自訂頁面" },
  { href: "/mockup/create", label: "建立" },
  { href: "/mockup/permissions", label: "權限" },
  { href: "/mockup/analytics", label: "分析" },
];

export function MockNav({ active }: { active?: string }) {
  const me = getCurrentUser();
  const next = findNextActivity();

  return (
    <header className="border-b border-sand bg-paper/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
        <Link href="/mockup" className="serif text-2xl text-terracotta font-semibold tracking-tight flex items-baseline gap-2 shrink-0">
          <span>相聚</span>
          <span className="text-xs text-ink/40 font-sans tracking-widest">Together</span>
        </Link>
        <nav className="flex items-center gap-1 ml-2 overflow-x-auto">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 px-3 py-1.5 rounded-soft text-sm transition ${
                  isActive
                    ? "bg-terracotta text-white shadow-card"
                    : "text-ink/70 hover:bg-sand/60 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {next && (
            <Link
              href="/mockup/activities"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-soft/40 text-sage-dark text-xs hover:bg-sage-soft/60 transition"
              title="下次相聚"
            >
              <span>📅 {formatShortDate(next.startsAt)}</span>
              <span className="text-ink/40">·</span>
              <span className="truncate max-w-[120px]">{next.title}</span>
            </Link>
          )}

          {/* Bell with notifications dropdown peek */}
          <div className="relative group">
            <button
              className="px-2 py-1.5 rounded-soft text-ink/60 hover:bg-sand/60 transition"
              title="管理員通知"
            >
              <span className="text-lg">🔔</span>
              <span className="absolute top-0.5 right-0.5 bg-terracotta text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                2
              </span>
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-72 bg-white rounded-soft shadow-soft border border-sand/60 p-2 z-40">
              <div className="px-3 py-2 text-xs text-ink/50 font-medium border-b border-sand">通知</div>
              <Link href="/mockup/inbox" className="block px-3 py-2 hover:bg-cream/60 rounded">
                <div className="text-sm text-ink">🛡 小明 申請 Editor</div>
                <div className="text-xs text-ink/50">2 小時前</div>
              </Link>
              <Link href="/mockup/inbox" className="block px-3 py-2 hover:bg-cream/60 rounded">
                <div className="text-sm text-ink">🛡 雅婷 申請 Editor</div>
                <div className="text-xs text-ink/50">昨天</div>
              </Link>
              <div className="border-t border-sand mt-1 pt-1">
                <Link href="/mockup/inbox" className="block px-3 py-1.5 text-xs text-terracotta hover:bg-cream/60 rounded">
                  打開收件夾 →
                </Link>
              </div>
            </div>
          </div>

          <Link href="/mockup/profile" className="flex items-center gap-2 hover:opacity-80">
            <Avatar member={me} size={32} />
            <span className="hidden md:block text-sm font-medium text-ink/80">{me.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
