import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { customPages, findMember } from "../_data";
import { Avatar } from "../_components/Avatar";

export default function PagesIndexMockup() {
  return (
    <main>
      <MockNav active="/mockup/pages" />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div>
            <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CUSTOM PAGES · CMS</p>
            <h1 className="serif text-3xl text-ink">家人的自訂頁面</h1>
            <p className="text-ink/60 text-sm mt-1">每位家人都能建立自己的小頁面——食譜、故事、相簿、家族樹...</p>
          </div>
          <Link
            href="/mockup/page-detail"
            className="ml-auto px-4 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            + 新增頁面
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-5 text-sm">
          <button className="px-3 py-1.5 rounded-soft bg-terracotta text-white">全部</button>
          <button className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40">我的</button>
          <button className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40">最近更新</button>
          <button className="px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40">最熱門</button>
          <input
            placeholder="搜尋頁面..."
            className="ml-auto px-3 py-1.5 rounded-soft border border-sand bg-white text-sm w-56"
          />
        </div>

        {/* Bookshelf grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customPages.map((p) => {
            const owner = findMember(p.ownerId);
            return (
              <Link
                key={p.id}
                href="/mockup/page-detail"
                className="group bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition"
              >
                <div className="h-36 relative" style={{ background: p.cover }}>
                  <span className="absolute top-3 right-3 bg-white/90 text-ink/70 text-xs px-2 py-1 rounded-full">
                    {p.blocks} 個區塊
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="serif text-xl text-ink mb-2 group-hover:text-terracotta transition">
                    {p.title}
                  </h3>
                  <p className="text-sm text-ink/65 leading-relaxed line-clamp-2 mb-4">{p.excerpt}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-sand">
                    <Avatar member={owner} size={24} />
                    <span className="text-xs text-ink/60">{owner.name}</span>
                    <span className="ml-auto text-xs text-ink/40">/{p.slug}</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* New page tile */}
          <Link
            href="/mockup/page-detail"
            className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-5 flex flex-col items-center justify-center text-center min-h-[260px] hover:bg-cream/70 transition"
          >
            <div className="text-4xl mb-3 text-ink/40">+</div>
            <div className="serif text-lg text-ink/70 mb-1">建立你的頁面</div>
            <p className="text-xs text-ink/50 max-w-[200px]">
              用 CMS 區塊堆出你的故事，未來也會支援 Markdown 與 HTML
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
