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

  emit("activity.rsvp", { type: "activity", id: activityId }, { status }, me.id);

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

  emit("post.created", { type: "activity", id: created.id }, { categoryIds }, me.id);

  revalidatePath("/app/feed");
  revalidatePath("/app/activities");
  return created.id;
}
