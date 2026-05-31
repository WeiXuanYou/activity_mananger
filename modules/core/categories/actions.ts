"use server";
/**
 * Server actions for the categories module.
 *
 * The picker / filter-bar UIs have had "+ 新分類" buttons since Phase A
 * but they were dead — this file wires them up. Gated by the
 * `category.create` permission (Member+ in the seed).
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { prismaCategoryToCategory } from "./db";
import type { Category, CategoryColor } from "./types";

export type CreateCategoryState = { error?: string; created?: Category };

const ALLOWED_COLORS: readonly CategoryColor[] = [
  "terracotta", "sage", "sand", "cream",
  "lavender", "sky", "rose",
] as const;

/** Slug from a free-text name. Lowercase, ASCII-safe, dashes. Falls back
 *  to a short random suffix when the name has no slug-able chars
 *  (e.g. pure CJK like "美食") — we can't romanize but we can still
 *  give the row a stable, unique URL. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  if (base.length >= 2) return base;
  // CJK-only or otherwise unrepresentable — random 6-char hex.
  return `cat-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new user-owned category. Permission-gated. Returns the new
 * row so the calling client can immediately select it.
 *
 * Name + emoji + color all required (color from a small palette so the
 * UI can render it). If the auto-generated slug collides, we retry with
 * a short suffix up to 5 times — beyond that something's badly wrong.
 */
export async function createCategoryAction(input: {
  name: string;
  emoji: string;
  color: CategoryColor;
}): Promise<CreateCategoryState> {
  await requirePermission("category.create");
  const me = await requireCurrentUser();

  const name = input.name.trim();
  const emoji = input.emoji.trim();
  if (!name) return { error: "請填分類名稱" };
  if (name.length > 20) return { error: "分類名稱太長（上限 20 字）" };
  if (!emoji) return { error: "請選一個 emoji 當圖示" };
  if ([...emoji].length > 2) return { error: "Emoji 太長（最多 2 個字元）" };
  if (!ALLOWED_COLORS.includes(input.color)) {
    return { error: "不認得這個顏色" };
  }

  // Reject duplicate-by-name to keep the picker tidy. SQLite's Prisma
  // connector doesn't support `mode: "insensitive"`, so we do the
  // case-fold in JS — fine because the table is tiny (~12 rows). This
  // treats "Food" and "food" as the same name.
  const allNames = await db.category.findMany({ select: { name: true } });
  const wanted = name.toLowerCase();
  if (allNames.some((c) => c.name.toLowerCase() === wanted)) {
    return { error: "已經有同名分類了，換一個吧" };
  }

  // Slug uniqueness — retry a few times if the auto-slug collides
  // (collisions are rare given the suffix logic above).
  const baseSlug = slugify(name);
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`;
    try {
      const row = await db.category.create({
        data: {
          slug,
          name,
          emoji,
          color: input.color,
          isDefault: false,
          createdById: me.id,
        },
      });
      // Refresh any list that shows the picker / filter bar.
      revalidatePath("/app/feed");
      revalidatePath("/app/activities");
      revalidatePath("/app/pages");
      revalidatePath("/app/posts/new");
      revalidatePath("/app/activities/new");
      return { created: prismaCategoryToCategory(row) };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code !== "P2002") throw e; // not a uniqueness collision
      // else retry with a different suffix
    }
  }
  return { error: "建立失敗，請稍後再試" };
}
