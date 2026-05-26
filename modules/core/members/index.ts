export type { Member } from "./types";

// Phase A — sync mock helpers (still used by /mockup/* pages)
export { members } from "./data";
export { findMember, listMembers, getMockCurrentUser } from "./queries";

// Phase C — async DB helpers (used by /app/* pages and other modules' DB queries)
export {
  prismaUserToMember,
  listMembersDb,
  findMemberDb,
  requireMemberDb,
  findMembersByIdsDb,
} from "./db";

// Shared UI components — work with the `Member` shape regardless of source
export { Avatar, AvatarStack } from "./components/Avatar";
