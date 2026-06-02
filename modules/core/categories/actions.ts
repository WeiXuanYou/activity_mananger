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
import { requirePermission, canCurrentUser } from "@/modules/permissions";
import { prismaCategoryToCategory } from "./db";
import type { Category, CategoryColor } from "./types";

/** Revalidate everywhere a category picker / filter bar is rendered. */
function revalidateCategorySurfaces() {
  revalidatePath("/app/feed");
  revalidatePath("/app/activities");
  revalidatePath("/app/pages");
  revalidatePath("/app/posts/new");
  revalidatePath("/app/activities/new");
  revalidatePath("/app/categories");
}

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
  /** Optional uploaded icon image URL. When set, takes visual precedence
   *  over the emoji. */
  iconImage?: string | null;
}): Promise<CreateCategoryState> {
  await requirePermission("category.create");
  const me = await requireCurrentUser();

  const name = input.name.trim();
  const emoji = input.emoji.trim();
  const iconImage = input.iconImage?.trim() || null;
  if (!name) return { error: "請填分類名稱" };
  if (name.length > 20) return { error: "分類名稱太長（上限 20 字）" };
  // Need an icon of SOME kind — an uploaded image OR an emoji.
  if (!iconImage && !emoji) return { error: "請選一個 emoji 或上傳圖片當圖示" };
  if (emoji && [...emoji].length > 2) return { error: "Emoji 太長（最多 2 個字元）" };
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
          emoji: emoji || "🏷",
          iconImage,
          color: input.color,
          isDefault: false,
          createdById: me.id,
        },
      });
      // Refresh any list that shows the picker / filter bar.
      revalidateCategorySurfaces();
      return { created: prismaCategoryToCategory(row) };
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code !== "P2002") throw e; // not a uniqueness collision
      // else retry with a different suffix
    }
  }
  return { error: "建立失敗，請稍後再試" };
}

/**
 * Delete a user-created category.
 *
 * Authorization (per product rule "分類管理員也可以移除但一般使用者不行移除"):
 *   - Admins (`admin.approve`) can delete ANY non-default category.
 *   - The creator can delete their OWN category.
 *   - Everyone else (incl. plain Members who can *create*) cannot delete.
 *   - System default categories (`isDefault`) are never deletable.
 *
 * The category's join rows (PostCategory / ActivityCategory / ...) cascade
 * on delete (FK onDelete: Cascade), so content keeps existing — it just
 * loses this tag.
 */
export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  const me = await requireCurrentUser();
  const cat = await db.category.findUnique({
    where: { id },
    select: { id: true, isDefault: true, createdById: true },
  });
  if (!cat) return {};

  const isAdmin = await canCurrentUser("admin.approve");
  // System default categories: ONLY admin can delete (Editor / Member /
  // even the seed-time createdBy can't). The previous rule blocked
  // everyone, but the operator asked for "admin can clean these up".
  if (cat.isDefault) {
    if (!isAdmin) return { error: "系統預設分類只有管理員可以刪除" };
    await db.category.delete({ where: { id } });
    revalidateCategorySurfaces();
    return {};
  }
  // User-created categories: admin OR the creator. Plain members can't.
  const isOwner = cat.createdById === me.id;
  if (!isAdmin && !isOwner) return { error: "只有管理員或建立者可以刪除分類" };

  await db.category.delete({ where: { id } });
  revalidateCategorySurfaces();
  return {};
}

/**
 * Edit a category's display fields (name / emoji / iconImage / color /
 * description). Authorization mirrors content moderation in spirit:
 *
 *   - Admins (`admin.approve`) can edit ANY category, default or custom.
 *   - Editors (`category.edit`, i.e. anyone with page.publish in this
 *     codebase — Editor+) can also edit any category.
 *   - The creator can edit their OWN custom category (default
 *     categories have no `createdById` so this branch never fires for
 *     them, which is intentional).
 *   - Plain Members can NOT edit categories they didn't create.
 *
 * Slug is immutable — renaming it would break every existing URL like
 * `/app/feed?cat=food`. If the user really wants a different slug they
 * can create a new category and delete the old one.
 */
export async function updateCategoryAction(input: {
  id: string;
  name?: string;
  emoji?: string;
  iconImage?: string | null;
  color?: CategoryColor;
  description?: string | null;
}): Promise<{ error?: string; updated?: Category }> {
  const me = await requireCurrentUser();
  const cat = await db.category.findUnique({
    where: { id: input.id },
    select: { id: true, isDefault: true, createdById: true, name: true },
  });
  if (!cat) return { error: "找不到分類" };

  const [isAdmin, isEditor] = await Promise.all([
    canCurrentUser("admin.approve"),
    // Editor+ also gates page.publish in this codebase — same trust level.
    canCurrentUser("page.publish"),
  ]);
  const isOwner = !cat.isDefault && cat.createdById === me.id;
  if (!isAdmin && !isEditor && !isOwner) {
    return { error: "只有管理員 / 編輯者 / 建立者可以編輯分類" };
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "請填分類名稱" };
    if (name.length > 20) return { error: "分類名稱太長（上限 20 字）" };
    // Duplicate-name guard (case-insensitive, like create). Same-row
    // rename is allowed.
    if (name.toLowerCase() !== cat.name.toLowerCase()) {
      const all = await db.category.findMany({ select: { id: true, name: true } });
      if (all.some((c) => c.id !== cat.id && c.name.toLowerCase() === name.toLowerCase())) {
        return { error: "已經有同名分類了，換一個吧" };
      }
    }
    data.name = name;
  }
  if (input.emoji !== undefined) {
    const emoji = input.emoji.trim();
    if (emoji && [...emoji].length > 2) return { error: "Emoji 太長（最多 2 個字元）" };
    data.emoji = emoji || "🏷";
  }
  if (input.iconImage !== undefined) {
    data.iconImage = input.iconImage?.trim() || null;
  }
  if (input.color !== undefined) {
    if (!ALLOWED_COLORS.includes(input.color)) return { error: "不認得這個顏色" };
    data.color = input.color;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  // Final safeguard: a category must have SOME icon — emoji or image.
  // (Only check when one of them is being cleared.)
  if ("emoji" in data || "iconImage" in data) {
    const nextEmoji = "emoji" in data ? (data.emoji as string) : undefined;
    const nextIcon = "iconImage" in data ? (data.iconImage as string | null) : undefined;
    if (nextEmoji === "" && nextIcon == null) {
      return { error: "請保留一個 emoji 或上傳圖片當圖示" };
    }
  }

  if (Object.keys(data).length === 0) {
    // Nothing to change — return the existing row so the client can close.
    const row = await db.category.findUniqueOrThrow({ where: { id: cat.id } });
    return { updated: prismaCategoryToCategory(row) };
  }

  const row = await db.category.update({ where: { id: cat.id }, data });
  revalidateCategorySurfaces();
  return { updated: prismaCategoryToCategory(row) };
}
