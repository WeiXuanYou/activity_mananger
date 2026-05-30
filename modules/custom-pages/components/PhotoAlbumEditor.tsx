"use client";
/**
 * Inline editor for a photo-album block. Visible only when the page is
 * in edit mode (caller decides). Lets the page owner:
 *   - Add photos (via the shared uploadImageAction)
 *   - Remove photos
 *   - Edit captions
 *   - Reorder (left/right within the grid)
 *   - Pick column count (2/3/4)
 *
 * Persists with updateBlockDataAction. Optimistic: we mutate local
 * state immediately so the UI doesn't wait on the round-trip.
 */
import { useState, useTransition } from "react";
import { uploadImageAction } from "@/modules/uploads/actions";
import { updateBlockDataAction } from "../actions";

type Photo = { url: string; caption?: string };

export function PhotoAlbumEditor({
  blockId,
  initialPhotos,
  initialCols,
}: {
  blockId: string;
  initialPhotos: Photo[];
  initialCols: number;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [cols, setCols] = useState<number>(initialCols);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Push the current state to the server. Bound by closure rather than
  // arguments so callers don't need to know the shape.
  const save = (next: { photos?: Photo[]; cols?: number }) => {
    const nextPhotos = next.photos ?? photos;
    const nextCols = next.cols ?? cols;
    if (next.photos) setPhotos(next.photos);
    if (next.cols !== undefined) setCols(next.cols);
    startTransition(() => updateBlockDataAction(blockId, { photos: nextPhotos, cols: nextCols }));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      const r = await uploadImageAction(fd);
      if (r.ok) {
        added.push({ url: r.url, caption: "" });
      } else {
        setError(r.error);
      }
    }
    setUploading(false);
    if (added.length) save({ photos: [...photos, ...added] });
  };

  const remove = (idx: number) => {
    save({ photos: photos.filter((_, i) => i !== idx) });
  };

  const swap = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[idx], next[target]] = [next[target], next[idx]];
    save({ photos: next });
  };

  const setCaption = (idx: number, caption: string) => {
    // Caption edits are noisy; debounce-by-blur instead of every keystroke.
    setPhotos((cur) => cur.map((p, i) => (i === idx ? { ...p, caption } : p)));
  };
  const commitCaption = (idx: number) => {
    save({ photos });
  };

  return (
    <div className="mt-3 rounded-soft border border-sage/30 bg-cream/40 p-3">
      <div className="flex items-center gap-3 mb-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
            className="hidden"
          />
          <span className="px-3 py-1.5 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition inline-block">
            {uploading ? "上傳中..." : "+ 加入照片（可多選）"}
          </span>
        </label>
        <div className="text-xs text-ink/55 flex items-center gap-2 ml-auto">
          欄數：
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => save({ cols: n })}
              className={`px-2 py-1 rounded text-xs ${cols === n ? "bg-sage-dark text-cream" : "bg-white border border-sand hover:bg-cream"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-terracotta-dark mb-2">⚠ {error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-ink/50 italic px-1 py-3">
          還沒有照片——點上方「加入照片」開始（可一次選多張）。
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {photos.map((photo, i) => (
            <div key={`${i}-${photo.url}`} className="relative group bg-white rounded-soft border border-sand overflow-hidden">
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
              </div>
              <input
                type="text"
                value={photo.caption ?? ""}
                onChange={(e) => setCaption(i, e.target.value)}
                onBlur={() => commitCaption(i)}
                placeholder="說明（可選）"
                className="w-full text-[10px] px-1.5 py-1 border-t border-sand bg-cream/30 focus:outline-none focus:bg-white"
              />
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  type="button"
                  title="左移"
                  onClick={() => swap(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-ink/70 hover:bg-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  title="右移"
                  onClick={() => swap(i, 1)}
                  disabled={i === photos.length - 1}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-ink/70 hover:bg-white disabled:opacity-30"
                >
                  →
                </button>
                <button
                  type="button"
                  title="刪除"
                  onClick={() => remove(i)}
                  className="w-6 h-6 rounded bg-white/90 text-xs text-terracotta hover:bg-terracotta hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
