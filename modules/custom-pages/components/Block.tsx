import { getBlockRenderer } from "../block-renderers";
import type { CustomPageBlock } from "../types";

/**
 * Render a single block by looking up its renderer in the registry.
 *
 * If no renderer is registered for the block's type (e.g. an old block
 * left over from a deprecated type), we show a graceful placeholder
 * rather than crashing — page editors can then delete or replace the
 * block.
 */
export function Block({ block }: { block: CustomPageBlock }) {
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
    <section className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
      <div className="text-[10px] text-sage-dark font-medium tracking-wider mb-2">
        {renderer.label.toUpperCase()}
      </div>
      {renderer.render(block.data)}
    </section>
  );
}

/** Render a list of blocks in order. */
export function BlockList({ blocks }: { blocks: CustomPageBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
        <div className="text-4xl mb-2">📄</div>
        <p className="serif text-lg text-ink/70">這個頁面還沒有 block</p>
      </div>
    );
  }
  return (
    <article className="space-y-6">
      {[...blocks].sort((a, b) => a.order - b.order).map((b) => (
        <Block key={b.id} block={b} />
      ))}
    </article>
  );
}
