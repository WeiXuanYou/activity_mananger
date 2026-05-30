"use server";
/**
 * Server actions for the activities module.
 *
 * EVERY mutation in this file MUST start with `await requirePermission(...)`.
 * That's the one rule that keeps the security model centralized.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { emit } from "@/modules/analytics";
import { notify } from "@/modules/notifications";

export type RsvpStatus = "GOING" | "MAYBE" | "DECLINED";

/**
 * Set the current user's RSVP status for an activity (upsert).
 * No `activity.create` permission needed — any signed-in user with
 * read access can RSVP. We still call `requireCurrentUser()` because
 * we need a user id to attach the RSVP to.
 */
export async function rsvpAction(activityId: string, status: RsvpStatus) {
  const me = await requireCurrentUser();

  await db.activityParticipant.upsert({
    where: { activityId_userId: { activityId, userId: me.id } },
    create: { activityId, userId: me.id, status },
    update: { status, respondedAt: new Date() },
  });

  void emit("activity.rsvp", { type: "activity", id: activityId }, { status }, me.id);

  // Notify the host (skip if you're RSVPing to your own activity)
  if (status === "GOING") {
    const activity = await db.activity.findUnique({
      where: { id: activityId },
      select: { authorId: true, title: true },
    });
    if (activity && activity.authorId !== me.id) {
      void notify({
        userId: activity.authorId,
        kind: "activity.rsvp",
        title: "有人要參加你的活動 🎉",
        body: `${me.name} 報名了「${activity.title}」`,
        link: `/app/activity/${activityId}`,
      });
    }
  }

  // Revalidate the affected pages so RSVP counts refresh immediately
  revalidatePath("/app/feed");
  revalidatePath("/app/activities");
  revalidatePath(`/app/activity/${activityId}`);
}

/**
 * Create a new activity. Caller must have `activity.create` permission
 * (Editor / Admin). Categories are optional; pass slugs and we resolve
 * them to ids inside.
 */
export async function createActivityAction(input: {
  title: string;
  description: string;
  location: string;
  startsAt: string;     // ISO datetime-local "YYYY-MM-DDTHH:mm"
  cover?: string;
  categorySlugs?: string[];
}) {
  await requirePermission("activity.create");
  const me = await requireCurrentUser();

  const categoryIds: string[] = [];
  if (input.categorySlugs?.length) {
    const cats = await db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true },
    });
    categoryIds.push(...cats.map((c) => c.id));
  }

  const created = await db.activity.create({
    data: {
      title: input.title,
      description: input.description,
      location: input.location,
      startsAt: new Date(input.startsAt),
      cover: input.cover ?? "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)",
      authorId: me.id,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  void emit("post.created", { type: "activity", id: created.id }, { categoryIds }, me.id);

  revalidatePath("/app/feed");
  revalidatePath("/app/activities");
  return created.id;
}

async function ensureOwnerOrModerator(meId: string, authorId: string): Promise<void> {
  if (authorId === meId) return;
  await requirePermission("activity.moderate");
}

/** Update an activity. Owner can edit own; activity.moderate edits others'. */
export async function updateActivityAction(input: {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  cover?: string;
  categorySlugs?: string[];
}): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.activity.findUnique({
    where: { id: input.id },
    select: { authorId: true },
  });
  if (!existing) throw new Error("找不到活動");
  await ensureOwnerOrModerator(me.id, existing.authorId);

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.location !== undefined) data.location = input.location.trim();
  if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
  if (input.cover !== undefined) data.cover = input.cover;

  if (input.categorySlugs) {
    const cats = await db.category.findMany({
      where: { slug: { in: input.categorySlugs } },
      select: { id: true },
    });
    await db.$transaction([
      db.activityCategory.deleteMany({ where: { activityId: input.id } }),
      db.activityCategory.createMany({
        data: cats.map((c) => ({ activityId: input.id, categoryId: c.id })),
      }),
    ]);
  }

  if (Object.keys(data).length) {
    await db.activity.update({ where: { id: input.id }, data });
  }
  revalidatePath("/app/activities");
  revalidatePath(`/app/activity/${input.id}`);
  revalidatePath("/app/feed");
  revalidatePath("/app/calendar");
}

/** Delete an activity. Sweeps Participants (FK cascade), and clears
 *  polymorphic Comments/Reactions explicitly. */
export async function deleteActivityAction(id: string): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.activity.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId);
  await db.$transaction([
    db.comment.deleteMany({ where: { parentType: "ACTIVITY", parentId: id } }),
    db.reaction.deleteMany({ where: { parentType: "ACTIVITY", parentId: id } }),
    db.activity.delete({ where: { id } }),
  ]);
  revalidatePath("/app/activities");
  revalidatePath("/app/feed");
  revalidatePath("/app/calendar");
}

/**
 * Hide / un-hide an activity. Manual flip of `hiddenAt`. Same
 * authorisation as edit / delete (owner OR activity.moderate). Hidden
 * activities are filtered from listings + feed but the detail page
 * still renders with a "已隱藏" banner.
 */
export async function setActivityHiddenAction(id: string, hidden: boolean): Promise<void> {
  const me = await requireCurrentUser();
  const existing = await db.activity.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing) return;
  await ensureOwnerOrModerator(me.id, existing.authorId);
  await db.activity.update({
    where: { id },
    data: { hiddenAt: hidden ? new Date() : null },
  });
  revalidatePath("/app/activities");
  revalidatePath("/app/feed");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/activity/${id}`);
}
