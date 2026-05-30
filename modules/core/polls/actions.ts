"use server";
/**
 * Server actions for polls.
 *
 * Voting itself doesn't require a fine-grained permission — any signed-in
 * user with read access to the poll can vote. We just need a `User` to
 * attach the vote to, so `requireCurrentUser()` is the gate.
 *
 * Creating polls / adding options DOES need permissions (poll.create
 * for the former; the latter only checks the poll's `allowAddOption`).
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { emit } from "@/modules/analytics";

/**
 * Cast (or un-cast) a vote on a poll option. Handles three cases:
 *   1. Single-select poll — replace the user's existing vote on this poll
 *   2. Multi-select poll  — toggle just this option
 *   3. Already voted for this option — un-vote (toggle off)
 */
export async function castVoteAction(pollId: string, optionId: string) {
  const me = await requireCurrentUser();

  const [poll, option] = await Promise.all([
    db.poll.findUnique({ where: { id: pollId }, select: { multiSelect: true, closesAt: true } }),
    db.pollOption.findUnique({ where: { id: optionId }, select: { pollId: true } }),
  ]);

  if (!poll) throw new Error("Poll not found");
  if (!option || option.pollId !== pollId) throw new Error("Option mismatch");
  if (poll.closesAt && poll.closesAt < new Date()) throw new Error("Poll closed");

  const existing = await db.pollVote.findUnique({
    where: { optionId_userId: { optionId, userId: me.id } },
  });

  // Wrap the read-modify-write in a transaction so two rapid clicks can't
  // both pass the "no existing vote" check and then collide on the unique
  // (optionId, userId) constraint.
  if (existing) {
    // Toggle off — user clicked the same option again
    await db.pollVote.delete({ where: { id: existing.id } });
  } else {
    await db.$transaction([
      // Single-select: clear any other vote on the same poll first.
      // (deleteMany is a no-op for multi-select since we filter the same poll.)
      ...(poll.multiSelect
        ? []
        : [db.pollVote.deleteMany({ where: { userId: me.id, option: { pollId } } })]),
      db.pollVote.create({ data: { optionId, userId: me.id } }),
    ]);
    void emit("vote.cast", { type: "poll", id: pollId }, { optionId }, me.id);
  }

  revalidatePath(`/app/poll/${pollId}`);
  revalidatePath("/app/feed");
}

/** Add a new option to a poll that allows community additions. */
export async function addPollOptionAction(pollId: string, label: string) {
  const me = await requireCurrentUser();
  const trimmed = label.trim();
  if (!trimmed) return;

  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { allowAddOption: true, options: { select: { id: true } } },
  });
  if (!poll) throw new Error("Poll not found");
  if (!poll.allowAddOption) throw new Error("This poll does not allow new options");

  await db.pollOption.create({
    data: { pollId, label: trimmed, addedById: me.id, order: poll.options.length },
  });

  revalidatePath(`/app/poll/${pollId}`);
}

/** Create a brand new poll. */
export async function createPollAction(input: {
  question: string;
  options: string[];
  multiSelect?: boolean;
  anonymous?: boolean;
  allowAddOption?: boolean;
  closesAt?: string;
  categorySlugs?: string[];
}) {
  await requirePermission("poll.create");
  const me = await requireCurrentUser();

  const opts = input.options.map((s) => s.trim()).filter(Boolean);
  if (opts.length < 2) throw new Error("Need at least 2 options");

  const categoryIds: string[] = [];
  if (input.categorySlugs?.length) {
    const cats = await db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true },
    });
    categoryIds.push(...cats.map((c) => c.id));
  }

  const created = await db.poll.create({
    data: {
      question: input.question,
      authorId: me.id,
      multiSelect: input.multiSelect ?? false,
      anonymous: input.anonymous ?? false,
      allowAddOption: input.allowAddOption ?? true,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      options: { create: opts.map((label, i) => ({ label, order: i })) },
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  revalidatePath("/app/feed");
  return created.id;
}
