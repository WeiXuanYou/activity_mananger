export type { UploadResult } from "./types";
export { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from "./types";
// Note: `uploadImageAction` is intentionally NOT re-exported from the
// barrel — it lives in actions.ts behind "use server", and is imported
// from the narrow `@/modules/uploads/actions` path by client components.
export { ImageUpload } from "./components/ImageUpload";
export { MultiImageUpload } from "./components/MultiImageUpload";
export type { UploadedImage } from "./components/MultiImageUpload";
