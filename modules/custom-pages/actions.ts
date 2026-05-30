"use server";
/**
 * Server actions for custom pages.
 *
 * Permissions:
 *   - page.create  → Member+ can create draft pages
 *   - page.publish → Editor+ can mark a page as published
 *
 * Block data is JSON-stringified for SQLite storage.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { emit } from "@/modules/analytics";
import type { BlockType } from "./types";

export type CreatePageState = { error?: string };

/**
 * Create a new custom page (with at least one starter markdown block).
 * Form-action shape so the create form can use useActionState.
 */
export async function createCustomPageAction(
  _prev: CreatePageState | undefined,
  formData: FormData,
): Promise<CreatePageState> {
  await requirePermission("page.create");
  const me = await requireCurrentUser();

  const title = String(formData.get("title") ?? "").trim();
  const slug  = String(formData.get("slug") ?? "").trim().toLowerCase();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const markdown = String(formData.get("markdown") ?? "").trim();
  const categorySlugs = formData.getAll("category").map(String).filter(Boolean);

  if (!title) return { error: "請填標題" };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { error: "slug 只能用小寫英數字和 dash (-)" };
  }

  const existing = await db.customPage.findUnique({ where: { slug } });
  if (existing) return { error: "這個 slug 已被使用" };

  const categoryIds: string[] = [];
  if (categorySlugs.length) {
    const cats = await db.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true },
    });
    categoryIds.push(...cats.map((c) => c.id));
  }

  const created = await db.customPage.create({
    data: {
      slug,
      title,
      excerpt: excerpt || title,
      ownerId: me.id,
      cover: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)",
      publishedAt: new Date(),
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      blocks: markdown
        ? { create: [{ type: "markdown", order: 0, data: JSON.stringify({ source: markdown }) }] }
        : undefined,
    },
  });

  void emit("post.created", { type: "page", id: created.id }, { slug, blockTypes: ["markdown"] }, me.id);

  revalidatePath("/app/pages");
  redirect(`/app/pages/${slug}`);
}

/**
 * Append a block to a page. Owner-only (we don't have full ACL yet).
 */
export async function addBlockAction(
  pageId: string,
  type: BlockType,
  data: Record<string, unknown>,
) {
  await requirePermission("page.create");
  const me = await requireCurrentUser();

  const page = await db.customPage.findUnique({ where: { id: pageId }, select: { ownerId: true, slug: true, blocks: { select: { id: true } } } });
  if (!page) throw new Error("Page not found");
  if (page.ownerId !== me.id) {
    await requirePermission("page.publish"); // editors can also edit anyone's
  }

  await db.customPageBlock.create({
    data: {
      pageId,
      type,
      order: page.blocks.length,
      data: JSON.stringify(data),
    },
  });

  revalidatePath(`/app/pages/${page.slug}`);
}

export async function deleteBlockAction(blockId: string) {
  const me = await requireCurrentUser();
  const block = await db.customPageBlock.findUnique({
    where: { id: blockId },
    include: { page: { select: { ownerId: true, slug: true } } },
  });
  if (!block) return;
  if (block.page.ownerId !== me.id) {
    await requirePermission("page.publish");
  }
  await db.customPageBlock.delete({ where: { id: blockId } });
  revalidatePath(`/app/pages/${block.page.slug}`);
}

/**
 * Move a block up (-1) or down (+1) within its page. Swaps the `order`
 * with its neighbour in a transaction; no-op if already at the boundary.
 */
export async function moveBlockAction(blockId: string, direction: "up" | "down") {
  const me = await requireCurrentUser();
  const block = await db.customPageBlock.findUnique({
    where: { id: blockId },
    include: { page: { select: { id: true, ownerId: true, slug: true } } },
  });
  if (!block) return;
  if (block.page.ownerId !== me.id) {
    await requirePermission("page.publish");
  }

  const targetOrder = direction === "up" ? block.order - 1 : block.order + 1;
  const neighbour = await db.customPageBlock.findFirst({
    where: { pageId: block.page.id, order: targetOrder },
  });
  if (!neighbour) return;

  // Two-step swap leaves room for a unique-constraint on (pageId, order)
  // we may add later. Use -1 as a sentinel "in transit" slot.
  await db.$transaction([
    db.customPageBlock.update({ where: { id: block.id }, data: { order: -1 } }),
    db.customPageBlock.update({ where: { id: neighbour.id }, data: { order: block.order } }),
    db.customPageBlock.update({ where: { id: block.id }, data: { order: targetOrder } }),
  ]);

  revalidatePath(`/app/pages/${block.page.slug}`);
}

/**
 * Add a starter block of any type with sensible default data — used by the
 * inline "+ 加入 [類型]" buttons. Returns the addBlockAction promise so the
 * client transition picks up its revalidation.
 */
export async function addStarterBlockAction(pageId: string, type: BlockType) {
  const defaults: Record<BlockType, Record<string, unknown>> = {
    markdown:      { source: "## 新段落\n\n你想分享什麼..." },
    richtext:      { html: "<p>新段落…</p>" },
    html:          { html: "<div><!-- 寫進你的 HTML --></div>" },
    image:         { url: "", caption: "" },
    "embed-poll":  { pollId: "" },
    "photo-album": { photos: [], cols: 3 },
  };
  return addBlockAction(pageId, type, defaults[type] ?? {});
}

/**
 * Update an arbitrary block's `data` JSON. Owner-or-page.publish gated
 * like the other block actions. Used by the photo-album editor to push
 * uploads + reorders + caption edits back to the DB.
 */
export async function updateBlockDataAction(
  blockId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const me = await requireCurrentUser();
  const block = await db.customPageBlock.findUnique({
    where: { id: blockId },
    include: { page: { select: { ownerId: true, slug: true } } },
  });
  if (!block) throw new Error("找不到 block");
  if (block.page.ownerId !== me.id) {
    await requirePermission("page.publish");
  }
  await db.customPageBlock.update({
    where: { id: blockId },
    data: { data: JSON.stringify(data) },
  });
  revalidatePath(`/app/pages/${block.page.slug}`);
}
