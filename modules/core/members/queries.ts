import { members } from "./data";
import type { Member } from "./types";

export const findMember = (id: string): Member => {
  const m = members.find((x) => x.id === id);
  if (!m) throw new Error(`Member not found: ${id}`);
  return m;
};

export const listMembers = (): Member[] => members;

/** Mockup helper — returns a fixed "current user" synchronously.
 *  Real session lives in modules/auth/session.ts (async). */
export const getMockCurrentUser = (): Member => findMember("u2");
