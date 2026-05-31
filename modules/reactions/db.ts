/**
 * DB-backed reaction queries. Polymorphic (parentType + parentId), so the
 * same helpers serve posts, activities, comments, and pages.
 */
import { db } from "@/lib/db";
import { isReactionKind, type ReactionKind, type ReactionParentType, type ReactionSummary } from "./types";

/** Reaction summary for ONE item (counts per kind + the viewer's choice). */
export async function getReactionSummaryDb(
  parentType: ReactionParentType,
  parentId: string,
  viewerId: string,
): Promise<ReactionSummary> {
  const [grouped, mine] = await Promise.all([
    db.reaction.groupBy({
      by: ["kind"],
      where: { parentType, parentId },
      _count: { _all: true },
    }),
    db.reaction.findFirst({
      where: { parentType, parentId, userId: viewerId },
      select: { kind: true },
    }),
  ]);

  const counts: Partial<Record<ReactionKind, number>> = {};
  let total = 0;
  for (const g of grouped) {
    if (!isReactionKind(g.kind)) continue;
    counts[g.kind] = g._count._all;
    total += g._count._all;
  }
  return {
    counts,
    total,
    mine: mine && isReactionKind(mine.kind) ? mine.kind : null,
  };
}

/**
 * Batch version — reaction summaries for many items of the same parentType
 * in two queries (group-by + viewer's reactions). Used by the feed so we
 * don't N+1 across posts.
 */
export async function getReactionSummariesDb(
  parentType: ReactionParentType,
  parentIds: string[],
  viewerId: string,
): Promise<Map<string, ReactionSummary>> {
  const result = new Map<string, ReactionSummary>();
  if (parentIds.length === 0) return result;

  const [grouped, mineRows] = await Promise.all([
    db.reaction.groupBy({
      by: ["parentId", "kind"],
      where: { parentType, parentId: { in: parentIds } },
      _count: { _all: true },
    }),
    db.reaction.findMany({
      where: { parentType, parentId: { in: parentIds }, userId: viewerId },
      select: { parentId: true, kind: true },
    }),
  ]);

  const mineByParent = new Map<string, ReactionKind | null>();
  for (const r of mineRows) {
    if (isReactionKind(r.kind)) mineByParent.set(r.parentId, r.kind);
  }

  for (const id of parentIds) {
    result.set(id, { counts: {}, total: 0, mine: mineByParent.get(id) ?? null });
  }
  for (const g of grouped) {
    if (!isReactionKind(g.kind)) continue;
    const s = result.get(g.parentId);
    if (!s) continue;
    s.counts[g.kind] = g._count._all;
    s.total += g._count._all;
  }
  return result;
}
