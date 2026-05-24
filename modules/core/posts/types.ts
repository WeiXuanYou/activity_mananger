export type PostKind = "ARTICLE" | "RECOMMENDATION" | "NOTE";

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  title?: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  isPinned?: boolean;
  pinnedById?: string;
  categoryIds: string[];
};
