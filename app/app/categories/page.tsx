import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listCategoriesDb,
  CategoryIcon,
  CategoryDeleteButton,
  CreateCategoryButton,
} from "@/modules/core/categories";

/**
 * /app/categories — lightweight category manager.
 *
 * Everyone signed in can see the list. Creating is gated on
 * `category.create` (Member+). Deleting is owner-or-admin (enforced in
 * the action); we only render the delete control when it'll actually work.
 */
export default async function CategoriesPage() {
  const me = await requireCurrentUser();
  const [categories, canCreate, isAdmin] = await Promise.all([
    listCategoriesDb(),
    canCurrentUser("category.create"),
    canCurrentUser("admin.approve"),
  ]);

  const defaults = categories.filter((c) => c.isDefault);
  const custom = categories.filter((c) => !c.isDefault);

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CATEGORIES</p>
          <h1 className="serif text-3xl text-ink">分類管理</h1>
          <p className="text-sm text-ink/60 mt-1">
            分類用來幫文章、活動、投票、頁面分門別類。可以用 emoji 或自己的圖片當圖示。
          </p>
        </div>
        {canCreate && (
          <div className="ml-auto">
            <CreateCategoryButton basePath="/app/categories" />
          </div>
        )}
      </div>

      <section className="mb-8">
        <h2 className="serif text-lg text-ink mb-2">自訂分類</h2>
        {custom.length === 0 ? (
          <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-8 text-center">
            <div className="text-3xl mb-2">🏷</div>
            <p className="text-sm text-ink/55">還沒有自訂分類{canCreate ? "，用右上角「+ 新分類」建立一個吧。" : "。"}</p>
          </div>
        ) : (
          <div className="bg-white rounded-soft border border-sand/60 divide-y divide-sand">
            {custom.map((cat) => {
              const canDelete = isAdmin || cat.createdById === me.id;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
                    <CategoryIcon category={cat} px={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink">{cat.name}</div>
                    {cat.description && <div className="text-xs text-ink/50 truncate">{cat.description}</div>}
                  </div>
                  <Link
                    href={`/app/feed?cat=${cat.slug}`}
                    className="text-xs text-terracotta hover:underline shrink-0"
                  >
                    看內容 →
                  </Link>
                  {canDelete && <CategoryDeleteButton id={cat.id} name={cat.name} />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="serif text-lg text-ink mb-2">系統預設分類</h2>
        <p className="text-xs text-ink/50 mb-3">這些是系統內建的分類，無法刪除。</p>
        <div className="flex flex-wrap gap-2">
          {defaults.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-cream border border-sand text-ink/70"
            >
              <CategoryIcon category={cat} px={16} />
              {cat.name}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
