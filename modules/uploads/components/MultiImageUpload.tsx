"use client";
/**
 * Multi-image picker. Uploads each chosen file through `uploadImageAction`,
 * keeps an ordered list of { url, thumbUrl }, and surfaces it to the parent
 * via `onChange` (and a hidden JSON field for plain-form submission).
 *
 * Used by the post create/edit forms. Reorder + remove supported. Caller
 * caps the count via `max`.
 */
import { useState, useTransition } from "react";
import { uploadImageAction } from "../actions";

export type UploadedImage = { url: string; thumbUrl?: string };

export function MultiImageUpload({
  name,
  label = "圖片（可選，可多張）",
  initial = [],
  max = 6,
  onChange,
}: {
  /** Hidden field name — receives the JSON-stringified array for form posts. */
  name?: string;
  label?: string;
  initial?: UploadedImage[];
  max?: number;
  onChange?: (images: UploadedImage[]) => void;
}) {
  const [images, setImages] = useState<UploadedImage[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const apply = (next: UploadedImage[]) => {
    setImages(next);
    onChange?.(next);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const added: UploadedImage[] = [];
    for (const file of Array.from(files)) {
      if (images.length + added.length >= max) break;
      const fd = new FormData();
      fd.set("file", file);
      // eslint-disable-next-line no-await-in-loop
      const r = await uploadImageAction(fd);
      if (r.ok) added.push({ url: r.url, thumbUrl: r.thumbUrl });
      else setError(r.error);
    }
    setUploading(false);
    if (added.length) apply([...images, ...added]);
  };

  const remove = (idx: number) => apply(images.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= images.length) return;
    const next = [...images];
    [next[idx], next[t]] = [next[t], next[idx]];
    apply(next);
  };

  const atMax = images.length >= max;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink/80">{label}</span>
        <span className="text-xs text-ink/40">{images.length} / {max}</span>
      </div>
      {name && <input type="hidden" name={name} value={images.length ? JSON.stringify(images) : ""} />}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {images.map((img, i) => (
            <div key={`${i}-${img.url}`} className="relative group aspect-square rounded-soft overflow-hidden border border-sand bg-cream/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl ?? img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                <button type="button" title="左移" onClick={() => move(i, -1)} disabled={i === 0}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-ink/70 hover:bg-white disabled:opacity-30">←</button>
                <button type="button" title="右移" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-ink/70 hover:bg-white disabled:opacity-30">→</button>
                <button type="button" title="移除" onClick={() => remove(i)}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-terracotta hover:bg-terracotta hover:text-white">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className={`inline-block ${atMax ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploading || atMax}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
        <span className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40 transition inline-flex items-center gap-1.5">
          {uploading ? "上傳中…" : atMax ? "已達上限" : "🖼 加入圖片"}
        </span>
      </label>
      {error && <p className="text-xs text-terracotta-dark mt-2">⚠ {error}</p>}
      <p className="text-xs text-ink/40 mt-2">JPG / PNG / WebP / GIF · 每張上限 5 MB</p>
    </div>
  );
}
