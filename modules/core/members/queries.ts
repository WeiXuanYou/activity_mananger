import { members } from "./data";
import type { Member } from "./types";

export const findMember = (id: string): Member => {
  const m = members.find((x) => x.id === id);
  if (!m) throw new Error(`Member not found: ${id}`);
  return m;
};

export const listMembers = (): Member[] => members;
