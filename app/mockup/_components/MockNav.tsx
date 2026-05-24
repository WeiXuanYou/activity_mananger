import Link from "next/link";
import { Avatar } from "./Avatar";
import { findMember } from "../_data";

const links = [
  { href: "/mockup/feed", label: "動態" },
  { href: "/mockup/pages", label: "自訂頁面" },
  { href: "/mockup/create", label: "建立" },
  { href: "/mockup/permissions", label: "權限" },
  { href: "/mockup/analytics", label: "分析" },
];

export function MockNav({ active }: { active?: string }) {
  const me = findMember("u2");
  return (
    <header className="border-b border-sand bg-paper/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-6">
        <Link href="/mockup" className="serif text-2xl text-terracotta font-semibold tracking-tight">
          家圈
        </Link>
        <nav className="flex items-center gap-1 ml-2">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-soft text-sm transition ${
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
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/mockup/inbox"
            className="relative px-2 py-1.5 rounded-soft text-ink/60 hover:bg-sand/60"
            title="管理員收件夾"
          >
            <span className="text-lg">🔔</span>
            <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </Link>
          <Link href="/mockup/profile" className="flex items-center gap-2 hover:opacity-80">
            <Avatar member={me} size={32} />
            <span className="hidden md:block text-sm font-medium text-ink/80">{me.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
