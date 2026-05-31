"use server";
/**
 * Lodging mutations. Any signed-in member can add a lodging recommendation
 * or past-stay note; delete is gated to the owner OR an admin so the
 * shared list doesn't get edit-warred.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";

export async function createLodgingAction(input: {
  name: string;
  region: string;
  address?: string;
  notes?: string;
  pricePerNightCents?: number;
  currency?: string;
  url?: string;
  rating?: number;
  stayedAt?: string;
  activityId?: string;
}): Promise<{ id?: string; error?: string }> {
  const me = await requireCurrentUser();
  const name = input.name.trim();
  const region = input.region.trim();
  if (!name) return { error: "請填住宿名稱" };
  if (!region) return { error: "請填地區（例：宜蘭礁溪）" };
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    return { error: "評分介於 1-5" };
  }
  if (input.url && !/^https?:\/\//i.test(input.url)) {
    return { error: "網址需以 http:// 或 https:// 開頭" };
  }

  const created = await db.lodging.create({
    data: {
      name,
      region,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      pricePerNightCents: input.pricePerNightCents ?? null,
      currency: input.currency?.trim() || "TWD",
      url: input.url?.trim() || null,
      rating: input.rating ?? null,
      addedById: me.id,
      stayedAt: input.stayedAt ? new Date(input.stayedAt) : null,
      activityId: input.activityId || null,
    },
  });

  revalidatePath("/app/lodging");
  if (created.activityId) revalidatePath(`/app/activity/${created.activityId}`);
  return { id: created.id };
}

export async function deleteLodgingAction(id: string): Promise<void> {
  const me = await requireCurrentUser();
  const row = await db.lodging.findUnique({ where: { id }, select: { addedById: true, activityId: true } });
  if (!row) return;
  const isOwner = row.addedById === me.id;
  const isAdmin = await canCurrentUser("admin.approve");
  if (!isOwner && !isAdmin) throw new Error("沒有權限刪除這個住宿");
  await db.lodging.delete({ where: { id } });
  revalidatePath("/app/lodging");
  if (row.activityId) revalidatePath(`/app/activity/${row.activityId}`);
}
