import { requireCurrentUser } from "@/modules/auth";
import { listWallPhotosDb } from "@/modules/core/photos";
import { PhotoGrid } from "./PhotoGrid";

/**
 * /app/photos — the "family album" wall. Aggregates every uploaded image
 * across posts, comments, and custom pages into one reverse-chron gallery
 * with a lightbox. Read-only; tapping a photo jumps to its source.
 */
export default async function PhotosPage() {
  await requireCurrentUser();
  const photos = await listWallPhotosDb();

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">PHOTOS</p>
        <h1 className="serif text-3xl text-ink">相簿牆</h1>
        <p className="text-ink/60 text-sm mt-1">
          大家發過的照片都收集在這裡，最新的在最前面。點一張看大圖。
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-12 text-center">
          <div className="text-4xl mb-2">🖼</div>
          <p className="serif text-lg text-ink/70 mb-1">還沒有照片</p>
          <p className="text-sm text-ink/55">在貼文、留言或頁面裡加上圖片，就會出現在這裡。</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink/40 mb-3">{photos.length} 張照片</p>
          <PhotoGrid photos={photos} />
        </>
      )}
    </main>
  );
}
