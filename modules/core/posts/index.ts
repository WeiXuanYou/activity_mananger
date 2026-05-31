export type { Post, PostKind, BonusKind } from "./types";
export { BONUS_KINDS } from "./types";

// Phase A — sync mock helpers (used by /mockup/*)
export { posts } from "./data";
export {
  listPosts,
  listPinnedPosts,
  listUnpinnedPosts,
  findPost,
  filterPostsByCategory,
  filterPostsByAuthor,
} from "./queries";

// Phase C — async DB helpers (used by /app/*)
export {
  prismaPostToPost,
  listPostsDb,
  listPinnedPostsDb,
  listUnpinnedPostsDb,
  findPostDb,
  filterPostsByCategorySlugDb,
  findLikedPostIdsByUserDb,
} from "./db";

// UI components — same Post shape regardless of source
export { PostCard } from "./components/PostCard";
export { LikeButton } from "./components/LikeButton";
