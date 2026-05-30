"use client";
/**
 * Read-only photo grid + lightbox.
 *
 * Click any thumbnail → fullscreen viewer. Keyboard: ← → cycle, ESC closes.
 * Body scroll is locked while open. Backdrop click also closes.
 *
 * `cols` controls the lg+ grid width; mobile/tablet always 1/2 columns
 * for legibility.
 */
import { useEffect, useState } from "react";

type Photo = { url: string; caption?: string };

const LG_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function PhotoAlbumViewer({
  photos,
  cols = 3,
}: {
  photos: Photo[];
  cols?: number;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const safeCols = Math.min(Math.max(cols, 2), 4);

  const close = () => setActiveIdx(null);
  const prev = () =>
    setActiveIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const next = () =>
    setActiveIdx((i) => (i === null ? null : (i + 1) % photos.length));

  // Keyboard nav while open
  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Lock background scroll while open
  useEffect(() => {
    if (activeIdx === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [activeIdx]);

  if (photos.length === 0) {
    return <p className="text-ink/40 italic text-sm">（相簿還沒有照片）</p>;
  }

  const active = activeIdx !== null ? photos[activeIdx] : null;

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${LG_COLS[safeCols]} gap-2 sm:gap-3 my-3`}>
        {photos.map((photo, i) => (
          <figure
            key={`${i}-${photo.url}`}
            className="rounded-soft overflow-hidden bg-cream/40 border border-sand/60 group"
          >
            <button
              type="button"
              onClick={() => setActiveIdx(i)}
              className="block w-full aspect-square overflow-hidden cursor-zoom-in"
              aria-label={`放大第 ${i + 1} 張`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? `照片 ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
              />
            </button>
            {photo.caption && (
              <figcaption className="text-xs text-ink/65 px-2 py-1.5 italic">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {active && (
        <div
          className="fixed top-0 left-0 z-[60] flex items-center justify-center"
          style={{ width: "100vw", height: "100vh" }}
          role="dialog"
          aria-label="放大檢視"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="關閉"
            onClick={close}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-default"
          />

          {/* Top-right close */}
          <button
            type="button"
            onClick={close}
            aria-label="關閉"
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center transition"
          >
            ✕
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/85 text-sm font-medium tabular-nums">
            {activeIdx! + 1} / {photos.length}
          </div>

          {/* Image */}
          <div className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption ?? `照片 ${activeIdx! + 1}`}
              className="max-w-[92vw] max-h-[78vh] rounded-soft shadow-soft object-contain"
            />
            {active.caption && (
              <p className="text-white/90 text-sm italic max-w-2xl text-center px-3">
                {active.caption}
              </p>
            )}
          </div>

          {/* Prev / Next (only if there's more than one) */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="上一張"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center transition"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="下一張"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center transition"
              >
                →
              </button>
            </>
          )}

          {/* Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/55 text-[11px]">
            ← → 切換 · ESC 關閉
          </div>
        </div>
      )}
    </>
  );
}
