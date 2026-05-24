import { members, findMember } from "@/modules/core/members";

/**
 * Phase A: returns a hardcoded "current user" so all pages can render.
 * Phase B: read from cookie/session, validate against DB.
 */
export function getCurrentUser() {
  return findMember("u2");
}

export function getAllSeededMembers() {
  return members;
}
