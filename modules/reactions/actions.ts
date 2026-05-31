"use server";
/**
 * Reaction server action. One reaction per user per item:
 *   - no existing reaction → create the chosen kind
 *   - same kind exists      → remove it (toggle off)
 *   - different kind exists  → switch to the new kind
 *
 * Polymorphic, so the same action serves posts / activities / comments /
 * pages. The caller passes a revalidate path so the right surface refreshes.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { emit } from "@/modules/analytics";
import { isReactionKind, type ReactionKind, type ReactionParentType } from "./types";

export async function setReactionAction(input: {
  parentType: ReactionParentType;
  parentId: string;
  kind: ReactionKind;
  /** Path to revalidate after the change (e.g. "/app/feed"). */
  revalidate?: string;
}): Promise<void> {
  const me = await requireCurrentUser();
  if (!isReactionKind(input.kind)) return;

  // The viewer's current reactions on this item. There SHOULD be at most
  // one, but the legacy LIKE-only toggle + the per-kind unique index mean a
  // user could historically have several kind rows. We treat "do they
  // currently react with the chosen kind" as the toggle signal and always
  // collapse to a single row, so switching can never hit a P2002 on the
  // (userId, parentType, parentId, kind) unique index.
  const existing = await db.reaction.findMany({
    where: { parentType: input.parentType, parentId: input.parentId, userId: me.id },
    select: { id: true, kind: true },
  });
  const hasChosen = existing.some((r) => r.kind === input.kind);

  // Wipe all of the viewer's reactions on this item first (idempotent),
  // then add the new one unless this was a toggle-off of the same kind.
  await db.$transaction(async (tx) => {
    if (existing.length) {
      await tx.reaction.deleteMany({
        where: { parentType: input.parentType, parentId: input.parentId, userId: me.id },
      });
    }
    if (!hasChosen) {
      await tx.reaction.create({
        data: { userId: me.id, parentType: input.parentType, parentId: input.parentId, kind: input.kind },
      });
    }
  });

  if (!hasChosen) {
    void emit("post.viewed", { type: input.parentType.toLowerCase(), id: input.parentId }, { reaction: input.kind }, me.id);
  }

  if (input.revalidate) revalidatePath(input.revalidate);
}
