import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { Avatar } from "@/modules/core/members";
import { listLodgingDb } from "@/modules/core/lodging";
import type { Lodging } from "@/modules/core/lodging";
import { DeleteLodgingButton } from "./DeleteLodgingButton";

/**
 * /app/lodging — community lodging knowledge base.
 *
 * Groups entries by region so a glance at "下次去宜蘭" lights up every
 * place we've stayed or recommended in that area. Each row carries
 * past-stay context (which activity, when) when available so the list
 * doubles as travel history.
 */
export default async function LodgingPage() {
  const me = await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");
  const all = await listLodgingDb();

  // Group by region. listLodgingDb already orders by region asc, so
  // this loop preserves a stable visual order.
  const byRegion = new Map<string, Lodging[]>();
  for (const x of all) {
    const arr = byRegion.get(x.region) ?? [];
    arr.push(x);
    byRegion.set(x.region, arr);
  }

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">LODGING</p>
          <h1 className="serif text-3xl text-ink">住宿筆記</h1>
          <p className="text-sm text-ink/60 mt-1">
            記錄住過的地方 + 推薦清單。下次在同一個地區辦活動時會自動跳出來給你參考。
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
        <div className="space-y-6">
          {Array.from(byRegion.entries()).map(([region, items]) => (
            <section key={region}>
              <h2 className="serif text-xl text-ink mb-2 flex items-baseline gap-2">
                <span>📍 {region}</span>
                <span className="text-xs text-ink/40">{items.length} 筆</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((l) => (
                  <LodgingCard
                    key={l.id}
                    lodging={l}
                    canDelete={isAdmin || l.addedById === me.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function LodgingCard({ lodging: l, canDelete }: { lodging: Lodging; canDelete: boolean }) {
  const price = l.pricePerNightCents != null
    ? `${l.currency} ${Math.round(l.pricePerNightCents / 100).toLocaleString()}/晚`
    : null;
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 flex flex-col">
      <div className="flex items-start gap-2 mb-1">
        <h3 className="serif text-lg text-ink leading-tight flex-1">{l.name}</h3>
        {l.rating && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-ink/70">
            {"★".repeat(l.rating)}{"☆".repeat(5 - l.rating)}
          </span>
        )}
      </div>
      {l.address && <p className="text-xs text-ink/55 mb-1">📌 {l.address}</p>}
      {price && <p className="text-xs text-ink/55 mb-1">💰 {price}</p>}
      {l.notes && <p className="text-sm text-ink/75 mt-2 whitespace-pre-wrap">{l.notes}</p>}

      <div className="mt-3 pt-3 border-t border-sand flex items-center gap-2 flex-wrap">
        {l.stayedAt ? (
          <span className="text-[11px] text-sage-dark bg-sage-soft/60 px-2 py-0.5 rounded-full">
            ✓ 住過 · {new Date(l.stayedAt).toLocaleDateString("zh-TW")}
          </span>
        ) : (
          <span className="text-[11px] text-ink/55 bg-cream px-2 py-0.5 rounded-full">推薦</span>
        )}
        {l.activityId && l.activityTitle && (
          <Link
            href={`/app/activity/${l.activityId}`}
            className="text-[11px] text-terracotta hover:underline truncate max-w-[12rem]"
          >
            ⇢ {l.activityTitle}
          </Link>
        )}
        {l.url && (
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-terracotta hover:underline"
          >
            🔗 網站
          </a>
        )}
        <div className="ml-auto flex items-center gap-2">
          {l.addedBy && (
            <span className="flex items-center gap-1 text-[11px] text-ink/45">
              <Avatar member={l.addedBy} size={18} />
              {l.addedBy.name}
            </span>
          )}
          {canDelete && <DeleteLodgingButton id={l.id} name={l.name} />}
        </div>
      </div>
    </div>
  );
}
