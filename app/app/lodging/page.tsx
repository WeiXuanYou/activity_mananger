import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { listLodgingDb } from "@/modules/core/lodging";
import { LodgingBrowser } from "./LodgingBrowser";

/**
 * /app/lodging — community lodging knowledge base.
 *
 * Records past stays + recommendations, searchable by region and price.
 * The server fetches everything (small dataset — a family's trips) and
 * hands per-row edit/delete flags to a client browser that filters in the
 * browser and groups results by region.
 */
export default async function LodgingPage() {
  const me = await requireCurrentUser();
  const [isAdmin, all] = await Promise.all([
    canCurrentUser("admin.approve"),
    listLodgingDb(),
  ]);

  const rows = all.map((l) => {
    const isOwner = l.addedById === me.id;
    return {
      lodging: l,
      canEdit: isAdmin || isOwner || Boolean(l.allowCollab),
      canDelete: isAdmin || isOwner,
    };
  });

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">LODGING</p>
          <h1 className="serif text-3xl text-ink">住宿筆記</h1>
          <p className="text-sm text-ink/60 mt-1">
            記錄住過的地方 + 推薦清單。可以依地區和價格搜尋；下次在同一個地區辦活動時也會自動跳出來給你參考。
          </p>
        </div>
        <Link
          href="/app/lodging/new"
          className="ml-auto px-4 py-2 rounded-soft bg-terracotta text-white font-medium text-sm shadow-card hover:bg-terracotta-dark transition"
        >
          + 新增住宿
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-4xl mb-2">🏨</div>
          <p className="serif text-lg text-ink/70 mb-2">還沒有住宿資料</p>
          <p className="text-sm text-ink/55 mb-4">記錄家族旅遊住過的地方，下次規劃就有參考</p>
          <Link href="/app/lodging/new" className="text-sm text-terracotta hover:underline">+ 新增第一筆</Link>
        </div>
      ) : (
        <LodgingBrowser rows={rows} />
      )}
    </main>
  );
}
