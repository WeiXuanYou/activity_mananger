"use server";
/**
 * Local-filesystem image upload — Phase H.
 *
 * Writes to /public/uploads/<random>.<ext>. The /public directory is
 * served at the site root by Next, so the returned URL (`/uploads/x.jpg`)
 * is immediately fetchable by <img src>.
 *
 * Constraints (all enforced server-side; never trust client claims):
 *   - MIME on the allow-list (`ALLOWED_IMAGE_MIME`)
 *   - <= 5 MB
 *   - Filename is a fresh random ID — we never trust the client filename.
 *     Extension is derived from MIME, not the filename, so a renamed
 *     ".exe" never reaches disk.
 *   - The whole file body is read into memory; for very large files this
 *     would be wasteful, but 5MB is fine.
 *
 * Production note: this works for a self-hosted "family server" deploy.
 * On serverless platforms (Vercel) you'd swap the body of this function
 * for an S3/Cloudinary upload — call sites and return shape don't change.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireCurrentUser } from "@/modules/auth";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, type UploadResult } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Form-action friendly upload. Expects FormData with `file: File`.
 * Returns a discriminated union so client code can render `error` cleanly.
 */
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
    const ext = EXT_BY_MIME[file.type];
    const name = `${randomBytes(12).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), buf);
    return { ok: true, url: `/uploads/${name}` };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[uploadImageAction] failed", err);
    return { ok: false, error: "上傳失敗，請再試一次" };
  }
}
