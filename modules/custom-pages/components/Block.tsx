import { getBlockRenderer } from "../block-renderers";
import type { CustomPageBlock } from "../types";
import { BlockToolbar, AddBlockRail } from "./BlockToolbar";

/**
 * Render a single block by looking up its renderer in the registry.
 *
 * If no renderer is registered for the block's type (e.g. an old block
 * left over from a deprecated type), we show a graceful placeholder
 * rather than crashing — page editors can then delete or replace the
 * block.
 */
export function Block({
  block,
  edit,
  isFirst,
  isLast,
}: {
  block: CustomPageBlock;
  edit?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const renderer = getBlockRenderer(block.type);
  if (!renderer) {
    return (
      <div className="bg-sand/40 rounded-soft border border-sand p-4 text-xs text-ink/55">
        ⚠ 找不到 <code className="text-terracotta">{block.type}</code> 的渲染器
        — 可能是已棄用的 block 類型，或這個版本尚未實作。
      </div>
    );
  }
  return (
    <section className={`relative group bg-white rounded-soft shadow-card border ${
      edit ? "border-sand/60 hover:border-terracotta/40" : "border-sand/60"
    } p-5`}>
      {edit && (
        <BlockToolbar blockId={block.id} isFirst={!!isFirst} isLast={!!isLast} />
      )}
      <div className="text-[10px] text-sage-dark font-medium tracking-wider mb-2">
        {renderer.label.toUpperCase()}
      </div>
      {renderer.render(block.data)}
    </section>
  );
}

/**
 * Render a list of blocks in order.
 *
 * When `edit` is on AND `pageId` is provided, each block gets a hover
 * toolbar (move up/down/delete) and an "+ 加入 block" rail before each
 * block + after the last one. Callers (the page detail) decide who sees
 * edit mode based on ownership/permissions.
 */
export function BlockList({
  blocks,
  edit,
  pageId,
}: {
  blocks: CustomPageBlock[];
  edit?: boolean;
  pageId?: string;
}) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    return (
      <div>
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="serif text-lg text-ink/70">這個頁面還沒有 block</p>
          {edit && pageId && (
            <p className="text-xs text-ink/45 mt-1">↓ 從下方挑一個類型開始加入</p>
          )}
        </div>
        {edit && pageId && <AddBlockRail pageId={pageId} />}
      </div>
    );
  }

  if (!edit) {
    return (
      <article className="space-y-6">
        {sorted.map((b) => <Block key={b.id} block={b} />)}
      </article>
    );
  }

  // Editing mode — interleave AddBlockRails between/around blocks.
  return (
    <article className="space-y-2">
      {pageId && <AddBlockRail pageId={pageId} />}
      {sorted.map((b, i) => (
        <div key={b.id} className="space-y-2">
          <Block
            block={b}
            edit
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
          />
          {pageId && <AddBlockRail pageId={pageId} />}
        </div>
      ))}
    </article>
  );
}
