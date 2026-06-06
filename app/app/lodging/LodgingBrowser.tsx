"use client";
/**
 * Searchable lodging browser. Receives the full list (small — a family's
 * trips) + per-row permission flags from the server, then filters in the
 * browser by:
 *   - free-text (name / region / address / notes)
 *   - region chips (distinct regions present)
 *   - price range (min / max per night, in whole currency units)
 *   - "住過 / 推薦" kind
 * Results stay grouped by region so the page reads the same as before.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/modules/core/members";
import type { Lodging } from "@/modules/core/lodging";
import { DeleteLodgingButton } from "./DeleteLodgingButton";

type Row = { lodging: Lodging; canEdit: boolean; canDelete: boolean };

export function LodgingBrowser({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [kind, setKind] = useState<"all" | "stayed" | "rec">("all");

  // Distinct regions for the chip row (sorted, stable).
  const regions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.lodging.region).filter(Boolean))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) * 100 : null;
    const max = maxPrice ? Number(maxPrice) * 100 : null;
    return rows.filter(({ lodging: l }) => {
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
  }, [rows, q, region, minPrice, maxPrice, kind]);

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
        </div>

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
          {byRegion.map(([r, items]) => (
            <section key={r}>
              <h2 className="serif text-xl text-ink mb-2 flex items-baseline gap-2">
                <span>📍 {r}</span>
                <span className="text-xs text-ink/40">{items.length} 筆</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((row) => (
                  <LodgingCard key={row.lodging.id} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function LodgingCard({ row }: { row: Row }) {
  const { lodging: l, canEdit, canDelete } = row;
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
