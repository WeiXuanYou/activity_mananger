import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { searchAll, type SearchHit } from "@/modules/core/search";
import { SearchBar } from "./SearchBar";

type Search = { searchParams: Promise<{ q?: string }> };

const KIND_BADGE: Record<SearchHit["kind"], { label: string; bg: string }> = {
  post:     { label: "📝 文章", bg: "bg-sage/15 text-sage-dark" },
  activity: { label: "🍖 活動", bg: "bg-terracotta-soft/60 text-terracotta-dark" },
  poll:     { label: "📊 投票", bg: "bg-sand text-ink/70" },
  page:     { label: "📄 頁面", bg: "bg-cream text-ink/70" },
  comment:  { label: "💬 留言", bg: "bg-cream/70 text-ink/55" },
};

/** Highlight every case-insensitive occurrence of `needle` in `text`. */
function Highlighted({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const lc = text.toLowerCase();
  const nlc = needle.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lc.indexOf(nlc, i);
    if (idx < 0) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="bg-yellow-200/70 text-ink px-0.5 rounded">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{parts}</>;
}

export default async function SearchPage({ searchParams }: Search) {
  await requireCurrentUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hits = query ? await searchAll(query) : [];

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">SEARCH</p>
        <h1 className="serif text-3xl text-ink mb-3">搜尋整個相聚</h1>
        <SearchBar defaultValue={query} />
      </div>

      {query && (
        <p className="text-sm text-ink/55 mb-4">
          {hits.length > 0
            ? <>找到 <strong className="text-ink">{hits.length}</strong> 筆結果包含 <strong className="text-terracotta">"{query}"</strong></>
            : <>沒有結果包含 <strong className="text-terracotta">"{query}"</strong>。試試別的字。</>}
        </p>
      )}

      {!query && (
        <div className="bg-cream/40 rounded-soft border border-sand p-6 text-sm text-ink/65 leading-relaxed">
          搜尋文章、活動、投票、自訂頁面、留言——把找東西的入口集中在一個地方。
          標題命中會排在前面，留言命中排最後。
        </div>
      )}

      <div className="space-y-3">
        {hits.map((h) => (
          <Link
            key={`${h.kind}-${h.id}`}
            href={h.href}
            className="block bg-white rounded-soft shadow-card border border-sand/60 p-4 hover:shadow-soft hover:border-terracotta/30 transition"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${KIND_BADGE[h.kind].bg}`}>
                {KIND_BADGE[h.kind].label}
              </span>
              <span className="text-xs text-ink/40 ml-auto">
                {new Date(h.createdAt).toLocaleDateString("zh-TW")}
              </span>
            </div>
            <h3 className="serif text-lg text-ink leading-snug">
              <Highlighted text={h.title} needle={query} />
            </h3>
            {h.snippet && (
              <p className="text-sm text-ink/65 mt-1 leading-relaxed">
                <Highlighted text={h.snippet} needle={query} />
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
