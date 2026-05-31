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
import { requirePermission, canCurrentUser } from "@/modules/permissions";
import { emit } from "@/modules/analytics";
import type { BlockType } from "./types";

/**
 * Throw unless the current user may EDIT this page's blocks.
 * Editable by: the owner, page.publish holders (Editor+), OR — when the
 * owner opted into collaboration — any signed-in member.
 */
async function ensureCanEditPage(page: { ownerId: string; allowCollab?: boolean }, meId: string): Promise<void> {
  if (page.ownerId === meId) return;
  if (page.allowCollab) return; // any signed-in member when collab is on
  await requirePermission("page.publish");
}

export type CreatePageState = { error?: string };

/** Slugify a title to ASCII; fall back to a random id for CJK-only titles. */
function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (base.length >= 2) return base;
  return `page-${Math.random().toString(36).slice(2, 8)}`;
}

/** Generate a slug that doesn't collide with an existing page. Appends
 *  -2, -3, … on conflict. URLs are assigned automatically — never typed. */
async function generateUniquePageSlug(title: string): Promise<string> {
  const base = slugifyTitle(title);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    // eslint-disable-next-line no-await-in-loop
    const clash = await db.customPage.findUnique({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
  }
  // Astronomically unlikely fallback.
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

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
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const markdown = String(formData.get("markdown") ?? "").trim();
  const categorySlugs = formData.getAll("category").map(String).filter(Boolean);

  if (!title) return { error: "請填標題" };

  const categoryIds: string[] = [];
  if (categorySlugs.length) {
    const cats = await db.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true },
    });
    categoryIds.push(...cats.map((c) => c.id));
  }

  // Slug is auto-assigned from the title — users never type it. We slugify
  // the title (ASCII-safe), fall back to a random id for CJK-only titles,
  // and append a numeric suffix if it collides. Because two requests can
  // race between "pick a free slug" and "insert it", we retry on the
  // unique-constraint violation (P2002) with a freshly-generated slug
  // instead of crashing.
  let slug = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    slug = await generateUniquePageSlug(title);
    try {
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
      break;
    } catch (e) {
      const err = e as { code?: string };
      if (err?.code === "P2002" && attempt < 4) continue; // slug raced — try again
      if (err?.code === "P2002") return { error: "建立失敗，請再試一次" };
      throw e;
    }
  }

  revalidatePath("/app/pages");
  // redirect() throws internally — must stay OUTSIDE the try/catch above.
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

  const page = await db.customPage.findUnique({ where: { id: pageId }, select: { ownerId: true, allowCollab: true, slug: true, blocks: { select: { id: true } } } });
  if (!page) throw new Error("Page not found");
  await ensureCanEditPage(page, me.id);

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
    include: { page: { select: { ownerId: true, allowCollab: true, slug: true } } },
  });
  if (!block) return;
  await ensureCanEditPage(block.page, me.id);
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
    include: { page: { select: { id: true, ownerId: true, allowCollab: true, slug: true } } },
  });
  if (!block) return;
  await ensureCanEditPage(block.page, me.id);

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
    // HTML renderer + inline editor both read `data.source` (NOT `html`),
    // so the starter must use `source` or the placeholder renders blank.
    html:          { source: "<p>寫進你的 HTML…</p>" },
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
    include: { page: { select: { ownerId: true, allowCollab: true, slug: true } } },
  });
  if (!block) throw new Error("找不到 block");
  await ensureCanEditPage(block.page, me.id);
  await db.customPageBlock.update({
    where: { id: blockId },
    data: { data: JSON.stringify(data) },
  });
  revalidatePath(`/app/pages/${block.page.slug}`);
}

/**
 * Delete a whole page (+ its blocks, which cascade).
 *
 * Authorization (per product rule "頁面管理員也可以移除別人的頁面或是自己"):
 *   - The owner can delete their own page.
 *   - Page admins — anyone with `page.publish` (Editor+) — can delete
 *     anyone's page.
 *   - Plain members can't delete others'.
 */
export async function deleteCustomPageAction(pageId: string): Promise<{ error?: string }> {
  const me = await requireCurrentUser();
  const page = await db.customPage.findUnique({
    where: { id: pageId },
    select: { ownerId: true },
  });
  if (!page) return {};
  if (page.ownerId !== me.id) {
    // page.publish = the "page admin" capability (Editor / Admin).
    if (!(await canCurrentUser("page.publish"))) {
      return { error: "只有頁面建立者或管理員可以刪除頁面" };
    }
  }
  // Blocks + category joins cascade via FK onDelete: Cascade.
  await db.customPage.delete({ where: { id: pageId } });
  revalidatePath("/app/pages");
  return {};
}

/**
 * Toggle whether a page is open to collaborative editing. Owner or a page
 * admin (page.publish) only.
 */
export async function setPageCollabAction(pageId: string, allow: boolean): Promise<void> {
  const me = await requireCurrentUser();
  const page = await db.customPage.findUnique({
    where: { id: pageId },
    select: { ownerId: true, slug: true },
  });
  if (!page) return;
  if (page.ownerId !== me.id) {
    await requirePermission("page.publish");
  }
  await db.customPage.update({ where: { id: pageId }, data: { allowCollab: allow } });
  revalidatePath(`/app/pages/${page.slug}`);
}
