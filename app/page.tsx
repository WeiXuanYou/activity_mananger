import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-sage-dark font-medium tracking-widest text-xs mb-3">
          FAMILY · FRIENDS · TOGETHER
        </p>
        <h1 className="serif text-5xl md:text-6xl text-ink leading-tight mb-4">
          家圈
        </h1>
        <p className="text-ink/70 mb-8">
          一個給家人與朋友的私密小社群——辦活動、投票、寫文章、留下回憶。
        </p>
        <Link
          href="/mockup"
          className="inline-block px-6 py-3 rounded-soft bg-terracotta text-white font-medium shadow-soft hover:bg-terracotta-dark transition"
        >
          進入 Mockup 預覽 →
        </Link>
        <p className="mt-6 text-ink/50 text-sm">
          Phase A · 純前端互動原型，尚未接資料庫
        </p>
      </div>
    </main>
  );
}
