import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listCustomPagesDb,
  filterCustomPagesByCategorySlugDb,
  PageCard,
} from "@/modules/custom-pages";
import { findCategoryBySlugDb, listCategoriesDb, CategoryFilterBar } from "@/modules/core/categories";
import { findMembersByIdsDb, Avatar } from "@/modules/core/members";

type Search = { searchParams: Promise<{ cat?: string }> };

export default async function AppPagesIndex({ searchParams }: Search) {
  const { cat: slug } = await searchParams;
  await requireCurrentUser();

  const [pages, categories, activeCategory, canCreate, canCreateCategory] = await Promise.all([
    slug ? filterCustomPagesByCategorySlugDb(slug) : listCustomPagesDb(),
    listCategoriesDb(),
    slug ? findCategoryBySlugDb(slug) : null,
    canCurrentUser("page.create"),
    canCurrentUser("category.create"),
  ]);

  // Hydrate owners
  const ownerIds = Array.from(new Set(pages.map((p) => p.ownerId)));
  const owners = await findMembersByIdsDb(ownerIds);
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CUSTOM PAGES</p>
          <h1 className="serif text-3xl text-ink">自訂頁面</h1>
          <p className="text-ink/60 text-sm mt-1">
            {activeCategory ? `「${activeCategory.name}」分類 · ${pages.length} 個頁面` : "用 block 堆出自己的小頁面"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/app/pages/new"
            className="ml-auto px-4 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition"
          >
            + 新增頁面
          </Link>
        )}
      </div>

      <div className="mb-6">
        <CategoryFilterBar categories={categories} activeSlug={slug} basePath="/app/pages" canCreate={canCreateCategory} />
      </div>

      {pages.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-4xl mb-2">📚</div>
          <p className="serif text-lg text-ink/70">這個分類還沒有頁面</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pages.map((p) => (
            <Link key={p.id} href={`/app/pages/${p.slug}`}>
              <PageCard page={p} />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">支援的 block 類型：</strong>
        📝 Rich Text · M↓ Markdown · &lt;/&gt; HTML（自動 sanitize）· 🖼 圖片 · 📊 嵌入投票
      </div>
    </main>
  );
}
