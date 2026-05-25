import { findCategoryBySlug } from "@/modules/core/categories";
import { customPages } from "./data";
import type { CustomPage } from "./types";

export const listCustomPages = (): CustomPage[] => customPages;
export const findCustomPage = (id: string): CustomPage | undefined =>
  customPages.find((p) => p.id === id);
export const filterCustomPagesByCategory = (categoryId: string): CustomPage[] =>
  customPages.filter((p) => p.categoryIds.includes(categoryId));
export const filterCustomPagesByCategorySlug = (slug: string): CustomPage[] => {
  const cat = findCategoryBySlug(slug);
  return cat ? filterCustomPagesByCategory(cat.id) : customPages;
};
export const filterCustomPagesByOwner = (ownerId: string): CustomPage[] =>
  customPages.filter((p) => p.ownerId === ownerId);
