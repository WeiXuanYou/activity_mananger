import type { Category } from "@/modules/core/categories";
import type { Member } from "@/modules/core/members";

/**
 * Built-in block types. Adding a new one:
 *   1. Add the key here
 *   2. Create modules/custom-pages/block-renderers/<NewType>.tsx that
 *      calls `registerBlockRenderer({...})`
 *   3. Add `import "./NewType"` in block-renderers/index.ts
 */
export type BlockType = "richtext" | "markdown" | "html" | "image" | "embed-poll";

/**
 * Polymorphic block payload. Each renderer narrows this to its expected
 * shape. Stored as a JSON-encoded string in SQLite; will become a real
 * `Json` column on Postgres later.
 *
 * Conventions per type:
 *   richtext     { html: string }                                   inline pre-rendered HTML
 *   markdown     { source: string }                                  raw markdown
 *   html         { source: string }                                  raw HTML — sanitized at render time
 *   image        { url: string; alt?: string; caption?: string }
 *   embed-poll   { pollId: string }
 */
export type BlockData = Record<string, unknown>;

/** A single block on a custom page. */
export type CustomPageBlock = {
  id: string;
  type: BlockType;
  order: number;
  data: BlockData;
};

export type CustomPage = {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  /** Optional pre-resolved owner (DB sources populate; mock sources leave undefined). */
  owner?: Member;
  excerpt: string;
  cover: string;
  /** Phase A mock: a count. Phase C/D: real blocks length. */
  blocks: number;
  /** Phase D — DB-backed sources populate this with fully resolved blocks. */
  resolvedBlocks?: CustomPageBlock[];
  categoryIds: string[];
  categories?: Category[];
};
