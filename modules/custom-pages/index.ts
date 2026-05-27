export type { CustomPage, BlockType, BlockData, CustomPageBlock } from "./types";

// Phase A — mock helpers
export { customPages } from "./data";
export {
  listCustomPages,
  findCustomPage,
  filterCustomPagesByCategory,
  filterCustomPagesByCategorySlug,
  filterCustomPagesByOwner,
} from "./queries";

// Phase D — DB helpers
export {
  prismaPageToCustomPage,
  listCustomPagesDb,
  findCustomPageBySlugDb,
  filterCustomPagesByCategorySlugDb,
} from "./db";

// Block-renderer registry
export {
  registerBlockRenderer,
  getBlockRenderer,
  listRegisteredBlockTypes,
} from "./block-renderers";

// UI components
export { PageCard } from "./components/PageCard";
export { Block, BlockList } from "./components/Block";
