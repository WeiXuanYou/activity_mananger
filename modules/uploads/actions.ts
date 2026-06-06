"use server";
/**
 * Local-filesystem image upload with on-the-fly thumbnail generation.
 *
 * WHERE FILES GO (important for deploys):
 *   Files are written to `UPLOADS_DIR` (env), defaulting to
 *   `<cwd>/public/uploads`. They are served back NOT as Next static assets
 *   but through the app route `app/uploads/[...path]/route.ts`, which streams
 *   them from `UPLOADS_DIR`. This matters because:
 *     - Next only serves `public/` files that existed at BUILD time; files
 *       written at runtime aren't picked up by `next start` on many hosts.
 *     - Containers / serverless often have an ephemeral or read-only
 *       `public/`. Pointing UPLOADS_DIR at a mounted persistent disk
 *       (e.g. /data/uploads) keeps images across deploys AND lets the
 *       route serve them regardless of the static pipeline.
 *
 * Why thumbnails: phones produce 3–8 MB photos. We keep the original (for
 * the lightbox) and emit an 800px JPEG thumbnail (for grids) at q80.
 *
 * Constraints (all enforced server-side; never trust client claims):
 *   - Real image content sniffed with sharp (not the client MIME)
 *   - <= 5 MB
 *   - Filename is a fresh random ID — we never trust the client filename.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { requireCurrentUser } from "@/modules/auth";
import { MAX_IMAGE_BYTES, type UploadResult } from "./types";
import { UPLOADS_DIR } from "./paths";

/** Thumbnail longest-edge in pixels. 800 is enough for retina 3-col grids
 *  on phones AND laptop, while keeping each thumb < 250 KB at q80. */
const THUMB_EDGE = 800;

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireCurrentUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "請選擇一個檔案" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `檔案太大（${Math.round(file.size / 1024 / 1024)} MB，上限 5 MB）` };
  }

  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const id = randomBytes(12).toString("hex");
    const buf = Buffer.from(await file.arrayBuffer());

    // Content sniffing — DON'T trust the client's declared MIME. We decode
    // the actual bytes with sharp and use the format IT detects. This
    // rejects a non-image payload disguised as `image/png`, and anchors the
    // on-disk extension to real content. SVG is intentionally absent
    // (vector + scriptable = XSS risk) so it's rejected here.
    let meta: { format?: string };
    try {
      meta = await sharp(buf).metadata();
    } catch {
      return { ok: false, error: "這個檔案看起來不是有效的圖片" };
    }
    const FORMAT_EXT: Record<string, string> = {
      jpeg: "jpg", png: "png", webp: "webp", gif: "gif",
    };
    const detected = meta.format ?? "";
    const ext = FORMAT_EXT[detected];
    if (!ext) {
      return { ok: false, error: `不支援這個圖片格式（${detected || "未知"}）` };
    }

    const origName = `${id}.${ext}`;
    const thumbName = `${id}.thumb.jpg`;

    await writeFile(path.join(UPLOADS_DIR, origName), buf);

    // Generate the thumbnail. GIFs preserve animation by not resampling.
    let thumbUrl = `/uploads/${origName}`;
    if (detected !== "gif") {
      try {
        const thumbBuf = await sharp(buf)
          .rotate() // honor EXIF orientation; phone photos are notorious for this
          .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        await writeFile(path.join(UPLOADS_DIR, thumbName), thumbBuf);
        thumbUrl = `/uploads/${thumbName}`;
      } catch (err) {
        // Sharp failed (corrupt EXIF? unsupported colorspace?) — degrade
        // gracefully to the original instead of failing the whole upload.
        // eslint-disable-next-line no-console
        console.warn("[uploadImageAction] thumb generation failed; using original", err);
      }
    }

    return { ok: true, url: `/uploads/${origName}`, thumbUrl };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[uploadImageAction] failed", err);
    return { ok: false, error: "上傳失敗，請再試一次" };
  }
}
