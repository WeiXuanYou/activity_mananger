import { registerBlockRenderer } from "./registry";

/**
 * Photo album block — responsive masonry-ish grid of uploaded images.
 *
 * Data shape:
 *   { photos: { url: string; caption?: string }[], cols?: 2 | 3 }
 *
 * Layout: CSS grid with 1 col on mobile, 2 on sm, `cols` (default 3) on
 * lg+. Each photo is a clickable square thumbnail (object-cover) so the
 * grid stays tidy regardless of source aspect ratios.
 *
 * Editing photos is handled separately by PhotoAlbumEditor — that's
 * a client component that calls updateBlockDataAction to persist
 * adds/removes/caption edits.
 */
type Photo = { url: string; caption?: string };

registerBlockRenderer({
  type: "photo-album",
  label: "📷 相簿",
  render: (data) => {
    const photos = (Array.isArray(data.photos) ? data.photos : []) as Photo[];
    const cols = Math.min(Math.max(Number(data.cols ?? 3), 2), 4);

    if (photos.length === 0) {
      return (
        <p className="text-ink/40 italic text-sm">（相簿還沒有照片）</p>
      );
    }

    // Tailwind doesn't accept dynamic class names, so we map cols → fixed classes
    const lgCols: Record<number, string> = {
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
    };

    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${lgCols[cols]} gap-2 sm:gap-3 my-3`}>
        {photos.map((photo, i) => (
          <figure
            key={`${i}-${photo.url}`}
            className="rounded-soft overflow-hidden bg-cream/40 border border-sand/60 group"
          >
            <div className="aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? `照片 ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
              />
            </div>
            {photo.caption && (
              <figcaption className="text-xs text-ink/65 px-2 py-1.5 italic">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  },
});
