/**
 * Phase C — DB-backed queries for the categories module.
 *
 * Categories are tiny (~12 rows). For routes that need them all (filter
 * bar, picker), we fetch the whole table once. For per-entity lookups
 * (`findCategoriesByIdsDb`), we accept the id list and do a single IN
 * query so callers can map back to ordered slug/color/emoji info.
 */
import { db } from "@/lib/db";
import type { Category, CategoryColor } from "./types";

export function prismaCategoryToCategory(row: {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  createdById: string | null;
  description: string | null;
}): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    color: row.color as CategoryColor,
    isDefault: row.isDefault,
    createdById: row.createdById ?? undefined,
    description: row.description ?? undefined,
  };
}

export async function listCategoriesDb(): Promise<Category[]> {
  const rows = await db.category.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(prismaCategoryToCategory);
}

export async function findCategoryBySlugDb(slug: string): Promise<Category | null> {
  const row = await db.category.findUnique({ where: { slug } });
  return row ? prismaCategoryToCategory(row) : null;
}

export async function findCategoriesByIdsDb(ids: string[]): Promise<Category[]> {
  if (ids.length === 0) return [];
  const rows = await db.category.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((r) => [r.id, prismaCategoryToCategory(r)]));
  return ids.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
}
