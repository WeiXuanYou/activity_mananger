import "server-only";
import path from "node:path";

/**
 * Where uploaded images live on disk.
 *
 * Defaults to `<cwd>/public/uploads` (works for `npm run dev` and simple
 * single-box deploys). Set `UPLOADS_DIR` to an absolute path on a
 * PERSISTENT, WRITABLE disk for production — e.g. a mounted volume at
 * `/data/uploads` — so images survive redeploys and work on hosts where
 * `public/` is read-only or ephemeral at runtime.
 *
 * Files are served by `app/uploads/[...path]/route.ts`, NOT the Next static
 * pipeline, so this directory does not have to be inside `public/`.
 */
export const UPLOADS_DIR = process.env.UPLOADS_DIR?.trim()
  ? path.resolve(process.env.UPLOADS_DIR.trim())
  : path.join(process.cwd(), "public", "uploads");

/**
 * Best-effort delete of uploaded files, given their public URLs
 * (`/uploads/<name>`). Used when content that owns uploaded images is
 * deleted, to stop the uploads disk growing forever. Safe by construction:
 *   - only acts on `/uploads/<basename>` URLs (ignores anything else, e.g.
 *     gradient placeholders or remote URLs),
 *   - resolves the basename under UPLOADS_DIR and refuses to touch anything
 *     that escapes it,
 *   - never throws (a missing file or read-only disk is fine).
 */
export async function deleteUploadFiles(urls: (string | null | undefined)[]): Promise<void> {
  const { unlink } = await import("node:fs/promises");
  const root = path.resolve(UPLOADS_DIR);
  for (const url of urls) {
    if (!url || !url.startsWith("/uploads/")) continue;
    const name = path.basename(url); // strip any path; keep just the filename
    const target = path.resolve(root, name);
    if (target !== root && !target.startsWith(root + path.sep)) continue;
    try {
      await unlink(target);
    } catch {
      // missing / read-only — ignore, this is best-effort cleanup
    }
  }
}
