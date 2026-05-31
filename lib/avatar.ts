/**
 * Browser-only avatar helpers shared by the setup form and the
 * account-settings form. Split from `modules/auth/validation` (which is
 * isomorphic) because this touches `createImageBitmap` / `<canvas>` and
 * only runs client-side.
 *
 * Keeping it in one place means an uploaded avatar looks identical no
 * matter which screen it came from — same crop, same size, same quality.
 */

/** Center-crop to a square and downscale to 256×256, returned as a JPEG
 *  data URL (~quality 0.82). The result stays well under
 *  AVATAR_MAX_BYTES so the server-side cap is a backstop, not the gate. */
export async function fileToCroppedDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const SIZE = 256;
  const side = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - side) / 2;
  const sy = (bmp.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  ctx.drawImage(bmp, sx, sy, side, side, 0, 0, SIZE, SIZE);
  return canvas.toDataURL("image/jpeg", 0.82);
}
