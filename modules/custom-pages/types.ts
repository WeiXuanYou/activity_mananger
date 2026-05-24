export type CustomPage = {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  excerpt: string;
  cover: string;
  blocks: number;
  categoryIds: string[];
};

export type BlockType = "richtext" | "markdown" | "html" | "image" | "embed-poll";

export type BlockData = Record<string, unknown>;
