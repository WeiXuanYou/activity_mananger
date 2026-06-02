import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import {
  listCategoriesDb,
  CategoryIcon,
  CategoryDeleteButton,
  CategoryEditButton,
  CreateCategoryButton,
} from "@/modules/core/categories";

/**
 * /app/categories — category manager.
 *
 * - Everyone signed in can SEE the list.
 * - Creating: `category.create` (Member+).
 * - Editing: admin OR editor OR creator-of-a-custom-one. The server
 *   action re-checks; we only render the button when it'll succeed.
 * - Deleting:
 *     - Custom categories → admin OR creator (Member can NOT delete others').
 *     - System default categories → admin ONLY.
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
              const isOwner = cat.createdById === me.id;
              // Custom categories: admin OR creator. Edit + delete have the
              // same rule now (Editors no longer get an automatic pass — kept
              // symmetric so people can predict what they can do).
              const canEdit = isAdmin || isOwner;
              const canDelete = isAdmin || isOwner;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
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
                  {canEdit && <CategoryEditButton category={cat} />}
                  {canDelete && <CategoryDeleteButton id={cat.id} name={cat.name} />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <h2 className="serif text-lg text-ink">系統預設分類</h2>
          <span className="text-xs text-ink/50">
            {isAdmin
              ? "只有管理員可以編輯 / 刪除預設分類。"
              : "這些是系統內建的分類，只有管理員能修改。"}
          </span>
        </div>
        <div className="bg-white rounded-soft border border-sand/60 divide-y divide-sand">
          {defaults.map((cat) => {
            // Defaults: admin-only for BOTH edit and delete (Editor no longer
            // has an automatic pass — matches updateCategoryAction).
            const canEdit = isAdmin;
            const canDelete = isAdmin;
            return (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
                  <CategoryIcon category={cat} px={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink flex items-center gap-1.5">
                    {cat.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage-soft/40 text-sage-dark font-medium">
                      系統
                    </span>
                  </div>
                  {cat.description && <div className="text-xs text-ink/50 truncate">{cat.description}</div>}
                </div>
                <Link
                  href={`/app/feed?cat=${cat.slug}`}
                  className="text-xs text-terracotta hover:underline shrink-0"
                >
                  看內容 →
                </Link>
                {canEdit && <CategoryEditButton category={cat} />}
                {canDelete && <CategoryDeleteButton id={cat.id} name={cat.name} />}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
