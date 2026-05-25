import Link from "next/link";

const tabs = [
  { href: "/mockup/feed",        label: "動態", emoji: "🏠" },
  { href: "/mockup/activities",  label: "活動", emoji: "📅" },
  { href: "/mockup/create",      label: "建立", emoji: "✏️", primary: true },
  { href: "/mockup/pages",       label: "頁面", emoji: "📚" },
  { href: "/mockup/profile",     label: "我",   emoji: "👤" },
];

/**
 * Mobile-only sticky bottom navigation. Shown < md.
 * Top-nav links are hidden < md to give this space.
 */
export function MockBottomNav({ active }: { active?: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur border-t border-sand shadow-[0_-4px_12px_-6px_rgba(60,40,30,0.10)]">
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {tabs.map((t) => {
          const isActive = active === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2 transition ${
                  isActive ? "text-terracotta" : "text-ink/55 hover:text-ink"
                }`}
              >
                <span
                  className={`text-xl leading-none ${
                    t.primary
                      ? "w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center -mt-3 shadow-soft"
                      : ""
                  }`}
                >
                  {t.emoji}
                </span>
                <span className={`text-[10px] ${t.primary ? "mt-0.5" : ""}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
