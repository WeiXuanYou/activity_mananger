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
