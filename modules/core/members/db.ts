/**
 * Phase C — DB-backed queries for the members module.
 *
 * Naming: each function ends in `Db` to clearly distinguish it from the
 * sync `data.ts`-backed helpers used by /mockup/* pages. Both return the
 * same `Member` TS type so UI components don't need to change.
 *
 * Adapter: `prismaUserToMember` maps the Prisma row (with role include)
 * into the slimmer `Member` shape that the UI cares about.
 */
import { db } from "@/lib/db";
import type { Role } from "@/modules/auth";
import type { Member } from "./types";

/**
 * Prisma User → UI Member.
 * Accepts the row shape that includes the role relation, so the caller
 * controls the include scope (we don't over-fetch).
 */
export function prismaUserToMember(
  row: { id: string; name: string; handle: string; avatarColor: string; initial: string; role: { name: string } },
): Member {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    role: row.role.name as Role,
    avatarColor: row.avatarColor,
    initial: row.initial,
  };
}

/** Read all members from DB. Phase C+ may add pagination. */
export async function listMembersDb(): Promise<Member[]> {
  const rows = await db.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(prismaUserToMember);
}

/** Find one member by id; returns null when not found. */
export async function findMemberDb(id: string): Promise<Member | null> {
  const row = await db.user.findUnique({ where: { id }, include: { role: true } });
  return row ? prismaUserToMember(row) : null;
}

/** Same as {@link findMemberDb} but throws — for "must exist" call sites. */
export async function requireMemberDb(id: string): Promise<Member> {
  const m = await findMemberDb(id);
  if (!m) throw new Error(`Member not found: ${id}`);
  return m;
}

/** Bulk lookup — returns the members for the given ids, in input order. */
export async function findMembersByIdsDb(ids: string[]): Promise<Member[]> {
  if (ids.length === 0) return [];
  const rows = await db.user.findMany({
    where: { id: { in: ids } },
    include: { role: true },
  });
  const byId = new Map(rows.map((r) => [r.id, prismaUserToMember(r)]));
  return ids.map((id) => byId.get(id)).filter((m): m is Member => Boolean(m));
}
