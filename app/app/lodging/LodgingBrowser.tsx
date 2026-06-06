"use client";
/**
 * Smart, searchable lodging browser. Receives the full list (small — a
 * family's trips) + per-row permission flags from the server, then in the
 * browser:
 *   - filters by text / region / price range / 住過-or-推薦
 *   - sorts by 推薦度 (value) / 價格 / 評分 / 最新
 *   - flags "超值" (good rating + below-average price) entries
 *   - shows a per-region summary (count, price range, avg, top pick)
 * Results stay grouped by region.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/modules/core/members";
import type { Lodging } from "@/modules/core/lodging";
import { DeleteLodgingButton } from "./DeleteLodgingButton";

type Row = { lodging: Lodging; canEdit: boolean; canDelete: boolean };
type SortKey = "value" | "priceAsc" | "priceDesc" | "rating" | "recent";

/**
 * "Value" score for smart sorting + the 超值 badge. Higher = better deal.
 * Rating (1-5) dominates; price pulls it down relative to the dataset's
 * cheapest. Entries with no rating get a neutral 3; no price → treated as
 * mid so they still rank but don't win on "cheap".
 */
function valueScore(l: Lodging, minCents: number, maxCents: number): number {
  const rating = l.rating ?? 3;
  // Normalise price into 0..1 (0 = cheapest, 1 = priciest). Flat 0.5 when
  // there's no price or no spread.
  let priceNorm = 0.5;
  if (l.pricePerNightCents != null && maxCents > minCents) {
    priceNorm = (l.pricePerNightCents - minCents) / (maxCents - minCents);
  }
  // rating weight 2, cheapness weight 1 → 0..12-ish range.
  return rating * 2 + (1 - priceNorm) * 2;
}

export function LodgingBrowser({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [kind, setKind] = useState<"all" | "stayed" | "rec">("all");
  const [sort, setSort] = useState<SortKey>("value");

  // Distinct regions for the chip row (sorted, stable).
  const regions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.lodging.region).filter(Boolean))).sort();
  }, [rows]);

  // Price span across ALL priced rows — anchors the value score + 超值 badge.
  const priceStats = useMemo(() => {
    const prices = rows.map((r) => r.lodging.pricePerNightCents).filter((p): p is number => p != null);
    if (prices.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { min, max, avg, count: prices.length };
  }, [rows]);

  /** "超值": rating ≥ 4 AND price at or below the dataset average. */
  const isGreatValue = (l: Lodging) =>
    (l.rating ?? 0) >= 4 && l.pricePerNightCents != null && priceStats.avg > 0 && l.pricePerNightCents <= priceStats.avg;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const minN = Number(minPrice);
    const maxN = Number(maxPrice);
    const min = minPrice.trim() && Number.isFinite(minN) ? minN * 100 : null;
    const max = maxPrice.trim() && Number.isFinite(maxN) ? maxN * 100 : null;
    const out = rows.filter(({ lodging: l }) => {
      if (region && l.region !== region) return false;
      if (kind === "stayed" && !l.stayedAt) return false;
      if (kind === "rec" && l.stayedAt) return false;
      if (min != null) {
        if (l.pricePerNightCents == null || l.pricePerNightCents < min) return false;
      }
      if (max != null) {
        if (l.pricePerNightCents == null || l.pricePerNightCents > max) return false;
      }
      if (needle) {
        const hay = [l.name, l.region, l.address ?? "", l.notes ?? ""].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    // Sort. Rows without the relevant field sort last (so a missing price
    // doesn't masquerade as "cheapest").
    const byPrice = (a: Row, b: Row, dir: 1 | -1) => {
      const pa = a.lodging.pricePerNightCents, pb = b.lodging.pricePerNightCents;
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return (pa - pb) * dir;
    };
    const sorted = [...out];
    if (sort === "value") {
      sorted.sort((a, b) => valueScore(b.lodging, priceStats.min, priceStats.max) - valueScore(a.lodging, priceStats.min, priceStats.max));
    } else if (sort === "priceAsc") {
      sorted.sort((a, b) => byPrice(a, b, 1));
    } else if (sort === "priceDesc") {
      sorted.sort((a, b) => byPrice(a, b, -1));
    } else if (sort === "rating") {
      sorted.sort((a, b) => (b.lodging.rating ?? 0) - (a.lodging.rating ?? 0));
    } else {
      // recent
      sorted.sort((a, b) => (a.lodging.createdAt < b.lodging.createdAt ? 1 : -1));
    }
    return sorted;
  }, [rows, q, region, minPrice, maxPrice, kind, sort, priceStats]);

  // Group filtered results by region (same visual as the static page).
  const byRegion = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of filtered) {
      const arr = m.get(r.lodging.region) ?? [];
      arr.push(r);
      m.set(r.lodging.region, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const hasFilter = Boolean(q || region || minPrice || maxPrice || kind !== "all");
  const clear = () => { setQ(""); setRegion(""); setMinPrice(""); setMaxPrice(""); setKind("all"); };

  const fmtPrice = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

  return (
    <div>
      {/* Search + filters */}
      <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋名稱 / 地區 / 地址 / 備註…"
            className="flex-1 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm focus:outline-none focus:border-terracotta"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="最低價"
              min={0}
              className="w-24 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm tabular-nums focus:outline-none focus:border-terracotta"
            />
            <span className="text-ink/40">–</span>
            <input
              type="number"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="最高價"
              min={0}
              className="w-24 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm tabular-nums focus:outline-none focus:border-terracotta"
            />
            <span className="text-xs text-ink/40">/ 晚</span>
          </div>
          {/* Smart sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            title="排序方式"
            className="px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm focus:outline-none focus:border-terracotta"
          >
            <option value="value">🌟 推薦度（性價比）</option>
            <option value="priceAsc">💰 價格低 → 高</option>
            <option value="priceDesc">💰 價格高 → 低</option>
            <option value="rating">⭐ 評分高 → 低</option>
            <option value="recent">🕑 最新加入</option>
          </select>
        </div>

        {/* Price insight from the whole dataset */}
        {priceStats.count > 0 && (
          <p className="text-xs text-ink/50">
            💡 已記錄 {priceStats.count} 筆有價格：最低 {fmtPrice(priceStats.min)}、平均 {fmtPrice(priceStats.avg)}、最高 {fmtPrice(priceStats.max)} / 晚。
            <span className="text-sage-dark">「超值」</span>＝評分 ≥ 4 且價格 ≤ 平均。
          </p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* kind filter */}
          {([["all", "全部"], ["stayed", "✓ 住過"], ["rec", "推薦"]] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                kind === k ? "bg-ink text-white border-transparent" : "bg-white text-ink/65 border-sand hover:bg-cream/40"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px h-4 bg-sand mx-1" />
          {/* region chips */}
          <button
            type="button"
            onClick={() => setRegion("")}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              region === "" ? "bg-terracotta text-white border-transparent" : "bg-white text-ink/65 border-sand hover:bg-cream/40"
            }`}
          >
            所有地區
          </button>
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                region === r ? "bg-terracotta text-white border-transparent" : "bg-white text-ink/65 border-sand hover:bg-cream/40"
              }`}
            >
              📍 {r}
            </button>
          ))}
          {hasFilter && (
            <button type="button" onClick={clear} className="ml-auto text-xs text-ink/50 hover:text-terracotta">
              清除篩選
            </button>
          )}
        </div>

        <p className="text-xs text-ink/45">
          找到 {filtered.length} 筆{hasFilter ? `（共 ${rows.length} 筆）` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm text-ink/60">沒有符合條件的住宿。試著放寬價格或換個地區。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byRegion.map(([r, items]) => {
            // Per-region price summary (only over priced rows in this group).
            const regionPrices = items
              .map((it) => it.lodging.pricePerNightCents)
              .filter((p): p is number => p != null);
            const rMin = regionPrices.length ? Math.min(...regionPrices) : null;
            const rMax = regionPrices.length ? Math.max(...regionPrices) : null;
            return (
            <section key={r}>
              <h2 className="serif text-xl text-ink mb-2 flex items-baseline gap-2 flex-wrap">
                <span>📍 {r}</span>
                <span className="text-xs text-ink/40">{items.length} 筆</span>
                {rMin != null && (
                  <span className="text-xs text-ink/45 font-sans">
                    · {rMin === rMax ? fmtPrice(rMin) : `${fmtPrice(rMin)}–${fmtPrice(rMax!)}`} / 晚
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((row) => (
                  <LodgingCard key={row.lodging.id} row={row} greatValue={isGreatValue(row.lodging)} />
                ))}
              </div>
            </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LodgingCard({ row, greatValue }: { row: Row; greatValue: boolean }) {
  const { lodging: l, canEdit, canDelete } = row;
  const price = l.pricePerNightCents != null
    ? `${l.currency} ${Math.round(l.pricePerNightCents / 100).toLocaleString()}/晚`
    : null;
  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 flex flex-col">
      <div className="flex items-start gap-2 mb-1">
        <h3 className="serif text-lg text-ink leading-tight flex-1 flex items-center gap-1.5 flex-wrap">
          {l.name}
          {greatValue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage text-white font-medium" title="評分高且價格在平均以下">
              ✨ 超值
            </span>
          )}
        </h3>
        {l.rating && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-ink/70 shrink-0">
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
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-terracotta hover:underline">
            🔗 網站
          </a>
        )}
        {l.allowCollab && (
          <span className="text-[11px] text-sage-dark bg-sage-soft/50 px-2 py-0.5 rounded-full">🤝 開放協作</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {l.addedBy && (
            <span className="flex items-center gap-1 text-[11px] text-ink/45">
              <Avatar member={l.addedBy} size={18} />
              {l.addedBy.name}
            </span>
          )}
          {canEdit && (
            <Link
              href={`/app/lodging/${l.id}/edit`}
              className="text-xs px-2 py-1 rounded-soft bg-white border border-sand text-ink/60 hover:bg-cream/40"
            >
              ✎ 編輯
            </Link>
          )}
          {canDelete && <DeleteLodgingButton id={l.id} name={l.name} />}
        </div>
      </div>
    </div>
  );
}
