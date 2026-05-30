"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES } from "@/modules/core/categories";
import { ImageUpload } from "@/modules/uploads";
import { createActivityAction, updateActivityAction } from "@/modules/core/activities/actions";

const GRADIENT_PRESETS = [
  { label: "暖橘",     value: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)" },
  { label: "鼠尾草",   value: "linear-gradient(135deg, #C5D1BB 0%, #7A8E6E 100%)" },
  { label: "玫瑰",     value: "linear-gradient(135deg, #F4D4DA 0%, #D98090 100%)" },
  { label: "黃昏",     value: "linear-gradient(135deg, #F4D6BA 0%, #D4A574 100%)" },
  { label: "薰衣草",   value: "linear-gradient(135deg, #E5D7EA 0%, #B58FBF 100%)" },
];

/**
 * Same form, two modes:
 *   - omit `editing` → calls createActivityAction, redirects to /app/activities
 *   - pass `editing` → calls updateActivityAction with that id, redirects to detail
 */
export type EditingActivity = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;     // "YYYY-MM-DDTHH:mm" for datetime-local
  cover: string;        // gradient or "url(/uploads/x) center/cover"
  categorySlugs: string[];
};

/** Pre-fill from AI / external source. All fields optional. */
export type ActivityPrefill = {
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  categorySlugs?: string[];
};

export function NewActivityForm({
  categories,
  editing,
  prefill,
}: {
  categories: Category[];
  editing?: EditingActivity;
  prefill?: ActivityPrefill;
}) {
  const router = useRouter();
  // Seed initial state from `editing` first (full record), else prefill (hints), else blank
  const [title, setTitle] = useState(editing?.title ?? prefill?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? prefill?.description ?? "");
  const [location, setLocation] = useState(editing?.location ?? prefill?.location ?? "");
  const [startsAt, setStartsAt] = useState(editing?.startsAt ?? prefill?.startsAt ?? "");
  // Extract initial url from "url(/x) center/cover" if any
  const initialUrl = editing?.cover?.match(/^url\((.+?)\)/)?.[1];
  const [coverUrl, setCoverUrl] = useState<string | null>(initialUrl ?? null);
  const [gradient, setGradient] = useState(
    editing && !initialUrl ? editing.cover : GRADIENT_PRESETS[0].value,
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    editing?.categorySlugs ?? prefill?.categorySlugs?.slice(0, 3) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleCat = (slug: string) => {
    setSelectedSlugs((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 3 ? cur : [...cur, slug],
    );
  };

  const submit = () => {
    if (!title.trim()) return setError("請填活動名稱");
    if (!startsAt) return setError("請選日期時間");
    if (!location.trim()) return setError("請填地點");
    setError(null);
    // If user uploaded a real image, use it; otherwise the gradient
    const cover = coverUrl ? `url(${coverUrl}) center/cover` : gradient;
    startTransition(async () => {
      try {
        if (editing) {
          await updateActivityAction({
            id: editing.id,
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            startsAt,
            cover,
            categorySlugs: selectedSlugs,
          });
          router.push(`/app/activity/${editing.id}`);
        } else {
          await createActivityAction({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            startsAt,
            cover,
            categorySlugs: selectedSlugs,
          });
          router.push("/app/activities");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "建立失敗");
      }
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      {prefill && !editing && (
        <div className="bg-gradient-to-r from-cream to-sage-soft/30 rounded-soft border border-sage/30 p-3 text-xs text-ink/70 flex items-start gap-2">
          <span className="text-lg">✨</span>
          <span><strong className="text-sage-dark">AI 已幫你草擬</strong>——可以直接送出，或先改一改再發。</span>
        </div>
      )}
      <label className="block">
        <span className="text-sm font-medium text-ink/80">活動名稱</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="例如：週末家族烤肉"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">日期 + 時間</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">地點</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="外公家後院"
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">活動描述</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="今年我們一樣在外公家烤肉..."
          rows={5}
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
        />
      </label>

      {/* Cover: upload OR gradient */}
      <div className="space-y-3">
        <ImageUpload
          name="cover"
          label="🖼 封面圖片（可選）"
          onUploaded={(url) => setCoverUrl(url)}
        />
        {!coverUrl && (
          <div>
            <span className="text-xs text-ink/55 block mb-2">或選一個漸層配色：</span>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGradient(g.value)}
                  className={`w-16 h-10 rounded-soft border-2 transition ${
                    gradient === g.value ? "border-terracotta shadow-card" : "border-sand"
                  }`}
                  style={{ background: g.value }}
                  title={g.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink/80">🏷 分類（最多 3 個）</span>
          <span className="text-xs text-ink/40">已選 {selectedSlugs.length} / 3</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const c = COLOR_CLASSES[cat.color];
            const isSel = selectedSlugs.includes(cat.slug);
            const disabled = !isSel && selectedSlugs.length >= 3;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCat(cat.slug)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                  isSel
                    ? `${c.bg} text-white border-transparent shadow-card`
                    : disabled
                    ? "bg-cream/40 text-ink/30 border-sand cursor-not-allowed"
                    : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <button
          onClick={submit}
          disabled={pending}
          className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? (editing ? "儲存中..." : "建立中...") : (editing ? "儲存變更" : "建立活動")}
        </button>
        <span className="ml-auto text-xs text-ink/40">
          {editing ? "儲存後回活動詳情" : "建立後跳到活動列表"}
        </span>
      </div>
    </div>
  );
}
