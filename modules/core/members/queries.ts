/**
 * Pure read functions for the members module. Phase A reads from the
 * in-memory `data.ts`; Phase C swaps the bodies to hit Prisma but
 * keeps the same signatures so callers don't change.
 */
import { members } from "./data";
import type { Member } from "./types";

/**
 * Look up a single member by id. Throws if not found because in our
 * mock data every id we reference is guaranteed to exist; a missing
 * id indicates a programming bug worth surfacing loudly.
 *
 * Phase C TODO: change return type to `Member | null` and let callers
 * handle the missing case explicitly, since DB lookups can legitimately
 * miss.
 */
export const findMember = (id: string): Member => {
  const m = members.find((x) => x.id === id);
  if (!m) throw new Error(`Member not found: ${id}`);
  return m;
};

/** All members. Phase C: replace with `db.user.findMany(...)`. */
export const listMembers = (): Member[] => members;

/**
 * **Mockup-only** helper. Returns a fixed "current user" (媽媽) so the
 * /mockup/* pages can render synchronously without async session lookup.
 *
 * Real authenticated pages MUST use `await getCurrentUser()` from
 * `@/modules/auth` instead.
 */
export const getMockCurrentUser = (): Member => findMember("u2");
