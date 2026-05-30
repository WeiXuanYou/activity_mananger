/**
 * Public API for block renderers. Adding a new block type:
 *   1. Create modules/custom-pages/block-renderers/<NewType>.tsx
 *      that imports `registerBlockRenderer` from "./registry" and
 *      registers itself at module-load time.
 *   2. Add a side-effect import below.
 *   3. Add the BlockType to modules/custom-pages/types.ts.
 *
 * The side-effect imports below are the ONLY place where each renderer
 * is brought into the bundle — importing a single renderer file from
 * elsewhere is a smell.
 */
export type { BlockRenderer } from "./registry";
export {
  registerBlockRenderer,
  getBlockRenderer,
  listRegisteredBlockTypes,
} from "./registry";

// Side-effect imports — each file calls registerBlockRenderer when loaded
import "./RichText";
import "./Markdown";
import "./Html";
import "./Image";
import "./EmbedPoll";
import "./PhotoAlbum";
