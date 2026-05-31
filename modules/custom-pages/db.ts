/**
 * Phase D — DB-backed queries for custom pages.
 *
 * Adapter resolves:
 *   - `owner` from the joined User row
 *   - `blocks` count from joined CustomPageBlock rows
 *   - `resolvedBlocks` populated when caller wants to render the page
 *   - `categoryIds` + `categories` from the join rows
 *
 * Block `data` is stored as JSON-encoded string in SQLite and parsed
 * back to an object on read.
 */
import { db } from "@/lib/db";
import { prismaCategoryToCategory } from "@/modules/core/categories";
import { prismaUserToMember } from "@/modules/core/members";
import type {
  BlockData,
  BlockType,
  CustomPage,
  CustomPageBlock,
} from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type CategoryRow = {
  id: string; slug: string; name: string; emoji: string; color: string;
  isDefault: boolean; createdById: string | null; description: string | null;
};

type PageRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  ownerId: string;
  owner: UserWithRole;
  allowCollab: boolean;
  blocks: { id: string; type: string; order: number; data: string }[];
  categories: { category: CategoryRow }[];
};

function parseBlockData(raw: string): BlockData {
  try {
    return JSON.parse(raw) as BlockData;
  } catch {
    return {};
  }
}

function rowToBlocks(rows: PageRow["blocks"]): CustomPageBlock[] {
  return rows
    .map((b) => ({
      id: b.id,
      type: b.type as BlockType,
      order: b.order,
      data: parseBlockData(b.data),
    }))
    .sort((a, b) => a.order - b.order);
}

export function prismaPageToCustomPage(row: PageRow): CustomPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: row.cover,
    ownerId: row.ownerId,
    owner: prismaUserToMember(row.owner),
    allowCollab: row.allowCollab,
    blocks: row.blocks.length,
    resolvedBlocks: rowToBlocks(row.blocks),
    categoryIds: row.categories.map((c) => c.category.id),
    categories: row.categories.map((c) => prismaCategoryToCategory(c.category)),
  };
}

const PAGE_INCLUDE = {
  owner: { include: { role: { select: { name: true } } } },
  blocks: { select: { id: true, type: true, order: true, data: true } },
  categories: { include: { category: true } },
} as const;

export async function listCustomPagesDb(): Promise<CustomPage[]> {
  const rows = await db.customPage.findMany({
    orderBy: { updatedAt: "desc" },
    include: PAGE_INCLUDE,
  });
  return rows.map(prismaPageToCustomPage);
}

export async function findCustomPageBySlugDb(slug: string): Promise<CustomPage | null> {
  const row = await db.customPage.findUnique({
    where: { slug },
    include: PAGE_INCLUDE,
  });
  return row ? prismaPageToCustomPage(row) : null;
}

export async function filterCustomPagesByCategorySlugDb(slug: string): Promise<CustomPage[]> {
  const cat = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (!cat) return [];
  const rows = await db.customPage.findMany({
    where: { categories: { some: { categoryId: cat.id } } },
    orderBy: { updatedAt: "desc" },
    include: PAGE_INCLUDE,
  });
  return rows.map(prismaPageToCustomPage);
}
