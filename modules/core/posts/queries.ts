import { posts } from "./data";
import type { Post } from "./types";

export const listPosts = (): Post[] => posts;
export const listPinnedPosts = (): Post[] => posts.filter((p) => p.isPinned);
export const listUnpinnedPosts = (): Post[] => posts.filter((p) => !p.isPinned);
export const findPost = (id: string): Post | undefined => posts.find((p) => p.id === id);
export const filterPostsByCategory = (categoryId: string): Post[] =>
  posts.filter((p) => p.categoryIds.includes(categoryId));
export const filterPostsByAuthor = (authorId: string): Post[] =>
  posts.filter((p) => p.authorId === authorId);
