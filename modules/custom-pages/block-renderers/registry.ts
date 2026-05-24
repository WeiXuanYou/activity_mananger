import type { BlockType, BlockData } from "../types";

export type BlockRenderer = {
  type: BlockType;
  label: string;
  render: (data: BlockData) => JSX.Element;
};

const registry: Partial<Record<BlockType, BlockRenderer>> = {};

export function registerBlockRenderer(r: BlockRenderer) {
  registry[r.type] = r;
}

export function getBlockRenderer(type: BlockType): BlockRenderer | undefined {
  return registry[type];
}

export function listRegisteredBlockTypes(): BlockType[] {
  return Object.keys(registry) as BlockType[];
}
