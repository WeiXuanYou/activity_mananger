import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import { listCustomPages, PageCard } from "@/modules/custom-pages";
import { CategoryFilterBar, listCategories } from "@/modules/core/categories";

export default function PagesIndexMockup() {
  const pages = listCustomPages();
  const categories = listCategories();

  return (
    <main>
      <MockNav active="/mockup/pages" />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CUSTOM PAGES · CMS</p>
            <h1 className="serif text-3xl text-ink">大家的自訂頁面</h1>
            <p className="text-ink/60 text-sm mt-1">每個人都能建立自己的小頁面——食譜、故事、相簿、家族樹...</p>
          </div>
          <Link
            href="/mockup/page-detail"
            className="ml-auto px-4 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            + 新增頁面
          </Link>
        </div>

        <div className="mb-6">
          <CategoryFilterBar categories={categories} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pages.map((p) => <PageCard key={p.id} page={p} />)}

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
