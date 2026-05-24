// Public API for block renderers. Adding a new block type:
//   1. Create modules/custom-pages/block-renderers/<Thing>.tsx that imports
//      registerBlockRenderer from "./registry" and registers itself.
//   2. Add a side-effect import here.
//   3. Add the BlockType to modules/custom-pages/types.ts.

export type { BlockRenderer } from "./registry";
export {
  registerBlockRenderer,
  getBlockRenderer,
  listRegisteredBlockTypes,
} from "./registry";

// Side-effect imports register each renderer
import "./RichText";
