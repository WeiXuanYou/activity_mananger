"use client";
/**
 * Responsive photo grid with a tap-to-open lightbox + an edit mode for
 * removing your own photos (moderators can remove any).
 */
import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WallPhoto } from "@/modules/core/photos";
import { removeWallPhotoAction } from "@/modules/core/photos/actions";

const SOURCE_BADGE: Record<WallPhoto["source"], string> = {
  post: "📝 貼文",
  comment: "💬 留言",
  page: "📄 頁面",
  album: "🖼 相簿",
};

export function PhotoGrid({
  photos,
  currentUserId,
  canModerate,
}: {
  photos: WallPhoto[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const canRemove = (p: WallPhoto) => canModerate || p.ownerId === currentUserId;

  const remove = (p: WallPhoto) => {
    if (!window.confirm("從相簿移除這張照片？也會從原始貼文 / 留言 / 頁面移除。")) return;
    const key = `${p.source}:${p.sourceId}:${p.refUrl}`;
    setRemoving(key);
    startTransition(async () => {
      const r = await removeWallPhotoAction({ source: p.source, sourceId: p.sourceId, refUrl: p.refUrl });
      setRemoving(null);
      if (r.error) { alert(r.error); return; }
      router.refresh();
    });
  };

  const anyEditable = photos.some(canRemove);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(() => setOpen((i) => (i == null ? i : (i + photos.length - 1) % photos.length)), [photos.length]);
  const next = useCallback(() => setOpen((i) => (i == null ? i : (i + 1) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, close, prev, next]);

  const active = open != null ? photos[open] : null;

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs text-ink/40">{photos.length} 張照片</p>
        {anyEditable && (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`ml-auto text-xs px-3 py-1.5 rounded-soft border transition ${
              editMode
                ? "bg-terracotta text-white border-transparent"
                : "bg-white border-sand text-ink/70 hover:bg-cream/40"
            }`}
          >
            {editMode ? "✓ 完成" : "✎ 編輯"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
        {photos.map((photo, i) => {
          const key = `${photo.source}:${photo.sourceId}:${photo.refUrl}`;
          const removable = editMode && canRemove(photo);
          return (
            <div
              key={`${i}-${photo.url}`}
              className="group relative aspect-square overflow-hidden rounded-soft border border-sand/60 bg-cream/30"
            >
              <button
                type="button"
                onClick={() => (editMode ? undefined : setOpen(i))}
                className="block w-full h-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.label}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] text-white bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition truncate text-left">
                  {photo.label}
                </span>
              </button>
              {removable && (
                <button
                  type="button"
                  onClick={() => remove(photo)}
                  disabled={removing === key}
                  title="移除這張照片"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-terracotta-dark shadow-card hover:bg-terracotta hover:text-white flex items-center justify-center text-sm disabled:opacity-50"
                >
                  {removing === key ? "…" : "🗑"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center"
          onClick={close}
        >
          <button type="button" onClick={close} className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none z-10" aria-label="關閉">×</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 sm:left-4 text-white/70 hover:text-white text-4xl leading-none z-10 px-2" aria-label="上一張">‹</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 sm:right-4 text-white/70 hover:text-white text-4xl leading-none z-10 px-2" aria-label="下一張">›</button>
          <figure className="max-w-[92vw] max-h-[88vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.fullUrl} alt={active.label} className="max-w-full max-h-[78vh] object-contain rounded-soft" />
            <figcaption className="text-center text-sm text-white/80 flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/15">{SOURCE_BADGE[active.source]}</span>
              <span>{active.label}</span>
              <Link href={active.href} className="text-terracotta-soft hover:underline">前往 →</Link>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
