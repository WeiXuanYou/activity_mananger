/**
 * DB-backed queries for the lodging module.
 *
 * Region matching is intentionally permissive — region substring inside
 * the activity location OR vice versa. With a tiny dataset (a family's
 * past trips) this is friendlier than exact equality.
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import type { Lodging } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  avatarImage: string | null;
  role: { name: string };
};

type LodgingRow = {
  id: string;
  name: string;
  region: string;
  address: string | null;
  notes: string | null;
  pricePerNightCents: number | null;
  currency: string;
  url: string | null;
  rating: number | null;
  addedById: string;
  addedBy: UserWithRole;
  allowCollab: boolean;
  stayedAt: Date | null;
  activityId: string | null;
  activity: { title: string } | null;
  createdAt: Date;
};

function adapt(row: LodgingRow): Lodging {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    address: row.address,
    notes: row.notes,
    pricePerNightCents: row.pricePerNightCents,
    currency: row.currency,
    url: row.url,
    rating: row.rating,
    addedById: row.addedById,
    addedBy: prismaUserToMember(row.addedBy),
    allowCollab: row.allowCollab,
    stayedAt: row.stayedAt ? row.stayedAt.toISOString() : null,
    activityId: row.activityId,
    activityTitle: row.activity?.title ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const LODGING_INCLUDE = {
  addedBy: { include: { role: { select: { name: true } } } },
  activity: { select: { title: true } },
} as const;

export async function listLodgingDb(): Promise<Lodging[]> {
  const rows = await db.lodging.findMany({
    orderBy: [{ region: "asc" }, { createdAt: "desc" }],
    include: LODGING_INCLUDE,
  });
  return rows.map(adapt);
}

/** Lodging matching a free-text location — for "this trip's area" hints.
 *  Empty location returns an empty list (no noise on the new-activity form). */
export async function listLodgingForLocationDb(location: string): Promise<Lodging[]> {
  const q = location.trim();
  if (q.length < 2) return [];
  // SQLite "contains" via LIKE; case-insensitive by default for ASCII,
  // and works fine for the CJK substring scenarios this surfaces in.
  const rows = await db.lodging.findMany({
    where: {
      OR: [
        { region: { contains: q } },
        // Also try the reverse — if region is the broader term ("宜蘭")
        // and the activity location is more specific ("宜蘭礁溪")
        // we want a hit. Walk every region row in JS for that comparison
        // since SQL has no "field is substring of constant" operator.
      ],
    },
    include: LODGING_INCLUDE,
  });
  // Secondary in-memory pass: anything where the activity location
  // contains the lodging's region (handles the "broader region" case).
  const extras = await db.lodging.findMany({ include: LODGING_INCLUDE });
  const seen = new Set(rows.map((r) => r.id));
  for (const r of extras) {
    if (!seen.has(r.id) && q.includes(r.region)) rows.push(r);
  }
  return rows.map(adapt);
}

export async function findLodgingDb(id: string): Promise<Lodging | null> {
  const row = await db.lodging.findUnique({ where: { id }, include: LODGING_INCLUDE });
  return row ? adapt(row) : null;
}
