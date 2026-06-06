"use client";
/**
 * "Add to album" — upload photos straight to the shared wall without
 * writing a post. Collapsed to a single button by default; expands to a
 * multi-file picker + optional caption, uploads each file through
 * uploadImageAction, then persists the set via addAlbumPhotosAction.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadImageAction } from "@/modules/uploads/actions";
import { addAlbumPhotosAction } from "@/modules/core/photos/actions";

type Pending = { url: string; thumbUrl?: string };

export function AlbumUploader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pics, setPics] = useState<Pending[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const added: Pending[] = [];
    for (const file of Array.from(files)) {
      if (pics.length + added.length >= 30) break;
      const fd = new FormData();
      fd.set("file", file);
      // eslint-disable-next-line no-await-in-loop
      const r = await uploadImageAction(fd);
      if (r.ok) added.push({ url: r.url, thumbUrl: r.thumbUrl });
      else setError(r.error);
    }
    setUploading(false);
    if (added.length) setPics((cur) => [...cur, ...added]);
  };

  const save = () => {
    if (pics.length === 0) return;
    startSave(async () => {
      const r = await addAlbumPhotosAction({
        images: pics.map((p) => ({ ...p, caption: caption.trim() || undefined })),
      });
      if (r.error) { setError(r.error); return; }
      setPics([]); setCaption(""); setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition"
      >
        ＋ 上傳照片到相簿
      </button>
    );
  }

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="serif text-lg text-ink">上傳照片到相簿</h2>
        <button type="button" onClick={() => { setOpen(false); setPics([]); setCaption(""); }} className="text-ink/40 hover:text-ink text-xl leading-none">×</button>
      </div>

      {pics.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {pics.map((p, i) => (
            <div key={`${i}-${p.url}`} className="relative aspect-square rounded-soft overflow-hidden border border-sand bg-cream/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl ?? p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPics((cur) => cur.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-xs text-terracotta hover:bg-terracotta hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-block cursor-pointer mb-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploading || pics.length >= 30}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
        <span className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40 transition inline-flex items-center gap-1.5">
          {uploading ? "上傳中…" : pics.length >= 30 ? "已達上限" : "🖼 選擇照片（可多張）"}
        </span>
      </label>

      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={200}
        placeholder="加一句說明（可選，套用到這批照片）"
        className="w-full px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm mb-3 focus:outline-none focus:border-terracotta"
      />

      {error && <p className="text-xs text-terracotta-dark mb-2">⚠ {error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || pics.length === 0}
          className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {saving ? "儲存中…" : `加入相簿（${pics.length}）`}
        </button>
        <span className="text-xs text-ink/40">JPG / PNG / WebP / GIF · 每張上限 5 MB</span>
      </div>
    </div>
  );
}
