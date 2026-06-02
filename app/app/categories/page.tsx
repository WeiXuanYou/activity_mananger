import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { listCategoriesDb, CategoryManager } from "@/modules/core/categories";

/**
 * /app/categories — category manager.
 *
 * - Everyone signed in can SEE the list.
 * - Creating: `category.create` (Member+).
 * - Editing / Deleting:
 *     - Custom categories → admin OR creator.
 *     - System defaults → admin ONLY.
 *
 * UI: by default the list is clean (just names + 看內容). A page-level
 * "✎ 編輯分類" toggle (paired with "+ 新分類") flips into edit mode that
 * reveals per-row ✎ / 🗑 buttons. The server action re-checks every rule,
 * so the toggle is purely visual — no bypass risk.
 */
export default async function CategoriesPage() {
  const me = await requireCurrentUser();
  const [categories, canCreate, isAdmin] = await Promise.all([
    listCategoriesDb(),
    canCurrentUser("category.create"),
    canCurrentUser("admin.approve"),
  ]);

  // Decide per-row permissions on the server (knows admin status + creator).
  const toRow = (cat: (typeof categories)[number]) => {
    if (cat.isDefault) {
      // Defaults: admin-only for both edit and delete.
      return { cat, canEdit: isAdmin, canDelete: isAdmin };
    }
    const isOwner = cat.createdById === me.id;
    return { cat, canEdit: isAdmin || isOwner, canDelete: isAdmin || isOwner };
  };
  const custom = categories.filter((c) => !c.isDefault).map(toRow);
  const defaults = categories.filter((c) => c.isDefault).map(toRow);

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CATEGORIES</p>
        <h1 className="serif text-3xl text-ink">分類管理</h1>
        <p className="text-sm text-ink/60 mt-1">
          分類用來幫文章、活動、投票、頁面分門別類。可以用 emoji 或自己的圖片當圖示。
        </p>
      </div>

      <CategoryManager
        custom={custom}
        defaults={defaults}
        canCreate={canCreate}
        isAdmin={isAdmin}
      />
    </main>
  );
}
