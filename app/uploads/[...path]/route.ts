/**
 * Serve uploaded images from UPLOADS_DIR.
 *
 * Why an app route instead of static `public/uploads`:
 *   - Next.js only serves `public/` files that existed at BUILD time; files
 *     written at runtime (user uploads) aren't reliably served by
 *     `next start`, and on container/serverless hosts `public/` is often
 *     ephemeral or read-only. Streaming from UPLOADS_DIR here makes uploads
 *     work everywhere AND lets the dir live on a persistent disk.
 *
 * Security:
 *   - Path traversal is blocked: we resolve the requested path under
 *     UPLOADS_DIR and reject anything that escapes it.
 *   - Only a fixed allow-list of image extensions is served, with a fixed
 *     Content-Type — never sniffed from the bytes, never executable.
 */
import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/modules/uploads/paths";

const CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  // Reject empty / malformed requests.
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Resolve under UPLOADS_DIR and ensure we didn't escape it (path traversal).
  const requested = path.resolve(UPLOADS_DIR, ...segments);
  const root = path.resolve(UPLOADS_DIR);
  if (requested !== root && !requested.startsWith(root + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const ext = path.extname(requested).toLowerCase();
  const contentType = CONTENT_TYPE[ext];
  if (!contentType) {
    return new NextResponse("Unsupported", { status: 415 });
  }

  let fileStat;
  try {
    fileStat = await stat(requested);
    if (!fileStat.isFile()) throw new Error("not a file");
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  // Stream the file. Uploaded names are random + content-addressed, so the
  // bytes for a given URL never change — cache aggressively.
  const stream = createReadStream(requested);
  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
