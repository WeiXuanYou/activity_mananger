"use server";
/**
 * Local-filesystem image upload with on-the-fly thumbnail generation.
 *
 * Why thumbnails: phones produce 3–8 MB photos. Without resizing, the
 * photo-album grid serves 4 MB per thumbnail — slow on cellular, bad
 * for data plans, and hits memory ceilings if there are 30 of them on
 * screen. With sharp, we keep the original (for the lightbox) and emit
 * an 800px thumbnail (for the grid) at JPEG q80 — typically 50–200 KB.
 *
 * Layout on disk:
 *   public/uploads/<id>.jpg         original (preserves caller's format)
 *   public/uploads/<id>.thumb.jpg   800px longest edge, JPEG q80
 *
 * The action returns BOTH urls. Callers that don't care just pick `url`
 * (existing behavior); callers that want the optimized version (grids,
 * cards) pick `thumbUrl`. If thumbnail generation fails we still return
 * the original — degraded but functional.
 *
 * Constraints (all enforced server-side; never trust client claims):
 *   - MIME on the allow-list (`ALLOWED_IMAGE_MIME`)
 *   - <= 5 MB
 *   - Filename is a fresh random ID — we never trust the client filename.
 *
 * Production note: this works for a self-hosted "family server" deploy.
 * On serverless platforms (Vercel) you'd swap the body of this function
 * for an S3/Cloudinary upload — call sites and return shape don't change.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { requireCurrentUser } from "@/modules/auth";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, type UploadResult } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Thumbnail longest-edge in pixels. 800 is enough for retina 3-col grids
 *  on phones AND laptop, while keeping each thumb < 250 KB at q80. */
const THUMB_EDGE = 800;

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireCurrentUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "請選擇一個檔案" };
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.type as typeof ALLOWED_IMAGE_MIME[number])) {
    return { ok: false, error: `不支援這個檔案類型（${file.type || "未知"}）` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `檔案太大（${Math.round(file.size / 1024 / 1024)} MB，上限 5 MB）` };
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const id = randomBytes(12).toString("hex");
    const buf = Buffer.from(await file.arrayBuffer());

    // Content sniffing — DON'T trust the client's declared MIME. We decode
    // the actual bytes with sharp and use the format IT detects, not the
    // `Content-Type` header. This rejects a non-image payload disguised as
    // `image/png`, and anchors the on-disk extension to real content so a
    // polyglot can't be served with a misleading name.
    let meta: { format?: string };
    try {
      meta = await sharp(buf).metadata();
    } catch {
      return { ok: false, error: "這個檔案看起來不是有效的圖片" };
    }
    // sharp's detected format → our canonical extension. SVG is absent on
    // purpose (vector + scriptable = XSS risk), so an SVG is rejected here
    // even if it somehow passed the MIME allow-list.
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

    // Write the original first — that's what `url` points to.
    await writeFile(path.join(UPLOAD_DIR, origName), buf);

    // Generate the thumbnail. GIFs preserve animation by not resampling
    // (sharp's default would freeze them at first frame); we just point
    // the thumb at the original in that case.
    let thumbUrl = `/uploads/${origName}`;
    if (detected !== "gif") {
      try {
        const thumbBuf = await sharp(buf)
          .rotate() // honor EXIF orientation; phone photos are notorious for this
          .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        await writeFile(path.join(UPLOAD_DIR, thumbName), thumbBuf);
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
