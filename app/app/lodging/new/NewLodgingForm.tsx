"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLodgingAction } from "@/modules/core/lodging/actions";

export function NewLodgingForm({
  defaultRegion = "",
  defaultActivityId = "",
}: { defaultRegion?: string; defaultActivityId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [region, setRegion] = useState(defaultRegion);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [pricePerNight, setPricePerNight] = useState(""); // user-facing currency units
  const [url, setUrl] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [stayedAt, setStayedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await createLodgingAction({
        name,
        region,
        address: address || undefined,
        notes: notes || undefined,
        pricePerNightCents: pricePerNight ? Math.round(Number(pricePerNight) * 100) : undefined,
        url: url || undefined,
        rating: rating === "" ? undefined : Number(rating),
        stayedAt: stayedAt || undefined,
        activityId: defaultActivityId || undefined,
      });
      if (r.error) { setError(r.error); return; }
      router.push(defaultActivityId ? `/app/activity/${defaultActivityId}` : "/app/lodging");
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6 space-y-4">
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
        {pending ? "儲存中..." : "儲存住宿 →"}
      </button>
    </div>
  );
}
