import { categories } from "./data";
import type { Category } from "./types";

export const listCategories = (): Category[] => categories;
export const listDefaultCategories = (): Category[] => categories.filter((c) => c.isDefault);
export const listCustomCategories = (): Category[] => categories.filter((c) => !c.isDefault);
export const findCategory = (id: string): Category | undefined =>
  categories.find((c) => c.id === id);
export const findCategoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);
export const findCategoriesByIds = (ids: string[]): Category[] =>
  ids.map((id) => findCategory(id)).filter((c): c is Category => Boolean(c));
