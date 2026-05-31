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
  /** STANDARD (default) or SCHEDULE — for schedule polls, options must be
   *  ISO datetime strings (YYYY-MM-DDTHH:mm). */
  kind?: "STANDARD" | "SCHEDULE";
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

  // For schedule polls: validate every option parses as a date
  const kind = input.kind === "SCHEDULE" ? "SCHEDULE" : "STANDARD";
  if (kind === "SCHEDULE") {
    for (const o of opts) {
      if (Number.isNaN(new Date(o).getTime())) {
        throw new Error(`排程投票的選項必須是有效的日期時間：${o}`);
      }
    }
  }

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
      kind,
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

async function ensureOwnerOrModerator(meId: string, authorId: string): Promise<void> {
  if (authorId === meId) return;
  await requirePermission("poll.moderate");
}

/**
 * Update a poll. Question + flags + deadline can be edited freely.
 * Options can only be edited if no votes have been cast yet — otherwise
 * we'd silently invalidate people's votes. Pass `options` to fully
 * replace the option set; omit to leave them untouched.
 */
export async function updatePollAction(input: {
  id: string;
  question?: string;
  options?: string[];
  multiSelect?: boolean;
  anonymous?: boolean;
  allowAddOption?: boolean;
  closesAt?: string | null;
  categorySlugs?: string[];
}): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.poll.findUnique({
    where: { id: input.id },
    select: { authorId: true, kind: true, options: { include: { votes: { select: { id: true } } } } },
  });
  if (!existing) throw new Error("找不到投票");
  await ensureOwnerOrModerator(me.id, existing.authorId);

  const data: Record<string, unknown> = {};
  if (input.question !== undefined) data.question = input.question.trim();
  if (input.multiSelect !== undefined) data.multiSelect = input.multiSelect;
  if (input.anonymous !== undefined) data.anonymous = input.anonymous;
  if (input.allowAddOption !== undefined) data.allowAddOption = input.allowAddOption;
  if (input.closesAt !== undefined) data.closesAt = input.closesAt ? new Date(input.closesAt) : null;

  // Options: replace-all, but ONLY if no votes have been cast — otherwise we
  // silently throw away people's votes. For schedule polls validate dates.
  if (input.options) {
    const totalVotes = existing.options.reduce((s, o) => s + o.votes.length, 0);
    if (totalVotes > 0) {
      throw new Error("已經有人投票了——不能修改選項");
    }
    const opts = input.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) throw new Error("至少需要 2 個選項");
    if (existing.kind === "SCHEDULE") {
      for (const o of opts) {
        if (Number.isNaN(new Date(o).getTime())) throw new Error(`不是有效的日期：${o}`);
      }
    }
    await db.$transaction([
      db.pollOption.deleteMany({ where: { pollId: input.id } }),
      db.pollOption.createMany({
        data: opts.map((label, i) => ({ pollId: input.id, label, order: i })),
      }),
    ]);
  }

  if (input.categorySlugs) {
    const cats = await db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true },
    });
    await db.$transaction([
      db.pollCategory.deleteMany({ where: { pollId: input.id } }),
      db.pollCategory.createMany({
        data: cats.map((c) => ({ pollId: input.id, categoryId: c.id })),
      }),
    ]);
  }

  if (Object.keys(data).length) {
    await db.poll.update({ where: { id: input.id }, data });
  }
  revalidatePath("/app/feed");
  revalidatePath(`/app/poll/${input.id}`);
}

/** Delete a poll. Cascades clean up options (FK) and votes (FK). */
export async function deletePollAction(id: string): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.poll.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId);
  // Clear reactions on this poll's comments too (polymorphic COMMENT
  // reactions aren't swept by the POLL-scoped delete).
  const commentIds = (
    await db.comment.findMany({ where: { parentType: "POLL", parentId: id }, select: { id: true } })
  ).map((c) => c.id);
  await db.$transaction([
    db.reaction.deleteMany({ where: { parentType: "COMMENT", parentId: { in: commentIds } } }),
    db.comment.deleteMany({ where: { parentType: "POLL", parentId: id } }),
    db.reaction.deleteMany({ where: { parentType: "POLL", parentId: id } }),
    db.poll.delete({ where: { id } }),
  ]);
  revalidatePath("/app/feed");
}

/**
 * Hide / un-hide a poll. Same gate as edit/delete (owner OR
 * poll.moderate). Hidden polls are filtered from list queries but the
 * detail page still renders for direct-link visits.
 */
export async function setPollHiddenAction(id: string, hidden: boolean): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.poll.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId);
  await db.poll.update({ where: { id }, data: { hiddenAt: hidden ? new Date() : null } });
  revalidatePath("/app/feed");
  revalidatePath(`/app/poll/${id}`);
}
