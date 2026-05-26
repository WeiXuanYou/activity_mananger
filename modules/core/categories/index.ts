export type { Category, CategoryColor } from "./types";
export { COLOR_CLASSES } from "./types";

// Phase A — sync mock helpers
export { categories } from "./data";
export {
  listCategories,
  listDefaultCategories,
  listCustomCategories,
  findCategory,
  findCategoryBySlug,
  findCategoriesByIds,
} from "./queries";

// Phase C — async DB helpers
export {
  prismaCategoryToCategory,
  listCategoriesDb,
  findCategoryBySlugDb,
  findCategoriesByIdsDb,
} from "./db";

// UI components
export { CategoryChip, CategoryChipList } from "./components/CategoryChip";
export { CategoryFilterBar } from "./components/CategoryFilterBar";
export { CategoryPicker } from "./components/CategoryPicker";
