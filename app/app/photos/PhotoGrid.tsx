"use client";
/**
 * Responsive masonry-ish photo grid with a tap-to-open lightbox. Receives
 * the aggregated photo list from the server; all interaction is local.
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { WallPhoto } from "@/modules/core/photos";

const SOURCE_BADGE: Record<WallPhoto["source"], string> = {
  post: "📝 貼文",
  comment: "💬 留言",
  page: "📄 頁面",
};

export function PhotoGrid({ photos }: { photos: WallPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
        {photos.map((photo, i) => (
          <button
            key={`${i}-${photo.url}`}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-soft border border-sand/60 bg-cream/30"
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
        ))}
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
