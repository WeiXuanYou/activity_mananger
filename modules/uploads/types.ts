/**
 * Image-upload domain types. Kept tiny on purpose — uploads have very
 * little state. The interesting bits live in actions.ts (validation +
 * write) and the upload-button component.
 */

/** What `uploadImageAction()` resolves to. */
export type UploadResult =
  | {
      ok: true;
      /** Original image URL — what to use in the lightbox / detail view. */
      url: string;
      /** 800px-edge JPEG thumbnail for grids / cards. Falls back to `url`
       *  when sharp can't process the file (e.g. animated GIF). */
      thumbUrl: string;
    }
  | { ok: false; error: string };

/** Allowed image MIME types for both Activities (covers) and Posts (attachments). */
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Per-image cap. 5 MB is plenty for family-album use; covers should
 *  ideally be <500 KB after client-side resize, but we accept up to 5 MB. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
