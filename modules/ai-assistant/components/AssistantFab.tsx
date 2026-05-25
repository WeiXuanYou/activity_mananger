import Link from "next/link";

/** Floating Action Button — bottom right on mockup pages. */
export function AssistantFab() {
  return (
    <Link
      href="/mockup/assistant"
      className="fixed bottom-20 right-4 md:bottom-5 md:right-5 z-50 group"
      title="AI 助手"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-sage/40 blur-md group-hover:bg-sage/60 transition" />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-sage to-sage-dark text-white flex items-center justify-center shadow-soft text-2xl group-hover:scale-110 transition">
          ✨
        </div>
        <span className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-card">
          AI
        </span>
      </div>
    </Link>
  );
}
