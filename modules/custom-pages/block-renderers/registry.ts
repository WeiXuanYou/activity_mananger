/**
 * Block renderer registry — the **extensibility seam** for the CMS.
 *
 * Why this file is separate from `./index.ts`:
 *
 * Each renderer file (e.g. `./RichText.tsx`) imports `registerBlockRenderer`
 * to register itself. If those renderers imported from `./index.ts`, and
 * `./index.ts` side-effect-imported the renderers, we'd have a circular
 * dependency that Next.js's build couldn't statically resolve (and the
 * page-data collection step would fail with "Cannot access 'h' before
 * initialization").
 *
 * Splitting registry storage (this file) from public API (`index.ts`)
 * breaks the cycle: renderers import from `./registry` only.
 */
import type { BlockType, BlockData } from "../types";

/** Shape that every block renderer must implement. */
export type BlockRenderer = {
  /** Discriminator used to pick the right renderer for a block's data. */
  type: BlockType;
  /** Human-friendly label shown in the editor toolbar. */
  label: string;
  /** Pure render function — takes the block's persisted JSON data. */
  render: (data: BlockData) => JSX.Element;
};

/**
 * In-memory map of registered renderers. `Partial<Record<...>>` because
 * not every BlockType has a renderer yet (markdown / html are reserved
 * for Phase D).
 */
const registry: Partial<Record<BlockType, BlockRenderer>> = {};

/** Called by each renderer file at module-load time to register itself. */
export function registerBlockRenderer(r: BlockRenderer) {
  registry[r.type] = r;
}

/** Look up a renderer by type. Returns `undefined` if not yet implemented. */
export function getBlockRenderer(type: BlockType): BlockRenderer | undefined {
  return registry[type];
}

/** List of types that currently have a working renderer. */
export function listRegisteredBlockTypes(): BlockType[] {
  return Object.keys(registry) as BlockType[];
}
