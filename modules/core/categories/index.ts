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
export { CategoryChip, CategoryChipList, CategoryIcon } from "./components/CategoryChip";
export { CategoryFilterBar } from "./components/CategoryFilterBar";
export { CategoryPicker } from "./components/CategoryPicker";
export { CreateCategoryModal } from "./components/CreateCategoryModal";
export { CreateCategoryButton } from "./components/CreateCategoryButton";
export { CategoryDeleteButton } from "./components/CategoryDeleteButton";
export { EditCategoryModal } from "./components/EditCategoryModal";
export { CategoryEditButton } from "./components/CategoryEditButton";
export { CategoryManager } from "./components/CategoryManager";
