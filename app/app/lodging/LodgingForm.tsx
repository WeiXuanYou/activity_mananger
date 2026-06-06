"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLodgingAction, updateLodgingAction } from "@/modules/core/lodging/actions";
import { fetchLodgingMetaAction } from "@/modules/core/lodging/fetch-meta";
import type { Lodging } from "@/modules/core/lodging";

/**
 * Shared create / edit form for lodging entries.
 *
 * - No `existing` → create mode (createLodgingAction).
 * - `existing` set → edit mode (updateLodgingAction), fields pre-filled.
 *
 * The collaboration toggle is shown only to the owner / admin (the caller
 * passes `canToggleCollab`); collaborators editing can't change it.
 */
export function LodgingForm({
  existing,
  defaultRegion = "",
  defaultActivityId = "",
  canToggleCollab = true,
}: {
  existing?: Lodging;
  defaultRegion?: string;
  defaultActivityId?: string;
  canToggleCollab?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(existing);
  const [name, setName] = useState(existing?.name ?? "");
  const [region, setRegion] = useState(existing?.region ?? defaultRegion);
  const [address, setAddress] = useState(existing?.address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pricePerNight, setPricePerNight] = useState(
    existing?.pricePerNightCents != null ? String(Math.round(existing.pricePerNightCents / 100)) : "",
  );
  const [url, setUrl] = useState(existing?.url ?? "");
  const [rating, setRating] = useState<number | "">(existing?.rating ?? "");
  const [stayedAt, setStayedAt] = useState(existing?.stayedAt ? existing.stayedAt.slice(0, 10) : "");
  const [allowCollab, setAllowCollab] = useState(Boolean(existing?.allowCollab));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // "Paste a link, auto-fill" — fetch a hotel/B&B page's metadata and
  // pre-fill the fields. Only what's empty gets filled (don't clobber what
  // the user already typed); price/region are suggestions they can tweak.
  const [importUrl, setImportUrl] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const importFromUrl = () => {
    const u = importUrl.trim();
    if (!u) return;
    setImportMsg(null);
    setImportBusy(true);
    startTransition(async () => {
      const r = await fetchLodgingMetaAction(u);
      setImportBusy(false);
      if (!r.ok) { setImportMsg(r.error); return; }
      const m = r.meta;
      const filled: string[] = [];
      if (m.name && !name.trim()) { setName(m.name); filled.push("名稱"); }
      if (m.region && !region.trim()) { setRegion(m.region); filled.push("地區"); }
      if (m.address && !address.trim()) { setAddress(m.address); filled.push("地址"); }
      if (m.pricePerNight != null && !pricePerNight.trim()) { setPricePerNight(String(m.pricePerNight)); filled.push("價格"); }
      if (m.description && !notes.trim()) { setNotes(m.description); filled.push("備註"); }
      // Always remember the source link in the URL field.
      if (!url.trim()) setUrl(r.sourceUrl);
      if (m.imageUrl) setPreviewImg(m.imageUrl);
      setImportMsg(
        filled.length
          ? `✓ 已自動帶入：${filled.join("、")}。請確認後再儲存。`
          : "已讀取連結，但你填的欄位都保留了（沒有覆蓋）。",
      );
    });
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const common = {
        name,
        region,
        address: address || undefined,
        notes: notes || undefined,
        pricePerNightCents: pricePerNight ? Math.round(Number(pricePerNight) * 100) : null,
        url: url || undefined,
        rating: rating === "" ? null : Number(rating),
        stayedAt: stayedAt || null,
        allowCollab,
      };
      if (isEdit && existing) {
        const r = await updateLodgingAction({ id: existing.id, ...common });
        if (r.error) { setError(r.error); return; }
        router.push("/app/lodging");
        router.refresh();
      } else {
        const r = await createLodgingAction({
          ...common,
          pricePerNightCents: common.pricePerNightCents ?? undefined,
          rating: common.rating ?? undefined,
          stayedAt: common.stayedAt ?? undefined,
          activityId: defaultActivityId || undefined,
        });
        if (r.error) { setError(r.error); return; }
        router.push(defaultActivityId ? `/app/activity/${defaultActivityId}` : "/app/lodging");
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6 space-y-4">
      {/* Paste-a-link auto-fill */}
      <div className="rounded-soft border border-sage/30 bg-sage-soft/20 p-3">
        <div className="text-sm font-medium text-ink/80 mb-1.5 flex items-center gap-1.5">
          <span>🔗</span> 貼上飯店 / 民宿連結，自動帶入資料
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://… （訂房網站、官網都可以）"
            className="flex-1 px-3 py-2 rounded-soft border border-sand bg-white text-sm focus:outline-none focus:border-terracotta"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); importFromUrl(); } }}
          />
          <button
            type="button"
            onClick={importFromUrl}
            disabled={importBusy || !importUrl.trim()}
            className="px-4 py-2 rounded-soft bg-sage-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shrink-0"
          >
            {importBusy ? "讀取中…" : "自動帶入"}
          </button>
        </div>
        {importMsg && <p className="text-xs mt-2 text-ink/70">{importMsg}</p>}
        {previewImg && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImg} alt="預覽" className="w-16 h-16 object-cover rounded-soft border border-sand" />
            <span className="text-xs text-ink/50">這是連結的封面圖（僅預覽，不會自動存）</span>
          </div>
        )}
        <p className="text-[11px] text-ink/45 mt-2">
          只會讀取連結頁面公開的預覽資訊（標題 / 價格 / 地址），你填過的欄位不會被覆蓋。
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">名稱 *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：礁溪老爺酒店"
          required
          maxLength={80}
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">地區 *</span>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="例如：宜蘭礁溪 · Kyoto · 墾丁"
          required
          maxLength={40}
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
        <p className="mt-1 text-xs text-ink/50">下次在同一個地區辦活動時，這筆會自動跳出來。</p>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">地址（可選）</span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={200}
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">每晚價格（TWD）</span>
          <input
            type="number"
            inputMode="numeric"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            placeholder="3500"
            min={0}
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">評分（1-5）</span>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
          >
            <option value="">—</option>
            {[1,2,3,4,5].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">入住日期（如曾經住過）</span>
          <input
            type="date"
            value={stayedAt}
            onChange={(e) => setStayedAt(e.target.value)}
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">網站（可選）</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">心得 / 備註</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="泡湯不錯、早餐普通、停車免費…"
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      {canToggleCollab && (
        <label className="flex items-start gap-3 px-3 py-2.5 rounded-soft border bg-cream/30 border-sand cursor-pointer">
          <input
            type="checkbox"
            checked={allowCollab}
            onChange={(e) => setAllowCollab(e.target.checked)}
            className="mt-1 rounded text-sage-dark"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">🤝 允許其他成員一起編輯</div>
            <div className="text-xs text-ink/55 mt-0.5">
              打開後，任何成員都能編輯這筆住宿。移除仍然只有你或管理員可以。
            </div>
          </div>
        </label>
      )}

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !name.trim() || !region.trim()}
        className="w-full sm:w-auto px-6 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
      >
        {pending ? "儲存中..." : isEdit ? "儲存變更 →" : "儲存住宿 →"}
      </button>
    </div>
  );
}
