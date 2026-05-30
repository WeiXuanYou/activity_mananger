import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import {
  listCustomPages,
  filterCustomPagesByCategorySlug,
  PageCard,
} from "@/modules/custom-pages";
import {
  CategoryFilterBar,
  findCategoryBySlug,
  listCategories,
} from "@/modules/core/categories";

type Search = { searchParams: Promise<{ cat?: string }> };

export default async function PagesIndexMockup({ searchParams }: Search) {
  const { cat: categorySlug } = await searchParams;
  const activeCategory = categorySlug ? findCategoryBySlug(categorySlug) : undefined;

  const categories = listCategories();
  const pages = activeCategory
    ? filterCustomPagesByCategorySlug(categorySlug!)
    : listCustomPages();

  return (
    <main>
      <MockNav active="/mockup/pages" />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CUSTOM PAGES · CMS</p>
            <h1 className="serif text-3xl text-ink">大家的自訂頁面</h1>
            <p className="text-ink/60 text-sm mt-1">
              {activeCategory
                ? `「${activeCategory.name}」分類下有 ${pages.length} 個頁面`
                : "每個人都能建立自己的小頁面——食譜、故事、相簿、家族樹..."}
            </p>
          </div>
          <Link
            href="/mockup/page-detail"
            className="ml-auto px-4 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            + 新增頁面
          </Link>
        </div>

        <div className="mb-6">
          <CategoryFilterBar
            categories={categories}
            activeSlug={categorySlug}
            basePath="/mockup/pages"
          />
        </div>

        {pages.length === 0 ? (
          <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="serif text-lg text-ink/70 mb-1">這個分類還沒有頁面</p>
            <Link href="/mockup/page-detail" className="text-sm text-terracotta hover:underline">
              在這個分類建立第一個頁面 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pages.map((p) => (
              <Link key={p.id} href="/mockup/page-detail" className="block">
                <PageCard page={p} />
              </Link>
            ))}

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
        )}
      </div>
    </main>
  );
}
