"use server";
/**
 * Expense server actions.
 *
 * Auth:
 *   - createExpenseAction: any signed-in user can record what THEY paid
 *     for an activity. (Anyone who hung the bill should be able to log
 *     it themselves.) The payer field is forced to me.id — you can't
 *     log someone else as the payer to make them owe money.
 *   - deleteExpenseAction: only the payer or activity host or
 *     activity.moderate can delete.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";

export async function createExpenseAction(input: {
  activityId: string;
  description: string;
  amountCents: number;
  currency?: string;
}): Promise<void> {
  const me = await requireCurrentUser();
  const desc = input.description.trim();
  if (!desc) throw new Error("請填說明");
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error("金額要大於 0");
  }
  if (input.amountCents > 100_000_00) {
    throw new Error("單筆金額不能超過 100,000");
  }

  // Verify the activity exists — fail noisily if not, since this is a UI bug
  const activity = await db.activity.findUnique({
    where: { id: input.activityId },
    select: { id: true },
  });
  if (!activity) throw new Error("找不到活動");

  await db.expense.create({
    data: {
      activityId: input.activityId,
      payerId: me.id,
      description: desc,
      amountCents: Math.round(input.amountCents),
      currency: input.currency ?? "TWD",
    },
  });
  revalidatePath(`/app/activity/${input.activityId}`);
}

export async function deleteExpenseAction(expenseId: string): Promise<void> {
  const me = await requireCurrentUser();
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { activity: { select: { id: true, authorId: true } } },
  });
  if (!expense) return;

  const isPayer = expense.payerId === me.id;
  const isHost = expense.activity.authorId === me.id;
  if (!isPayer && !isHost) {
    // Falls through to permission check — activity.moderate users can clean up
    if (!(await canCurrentUser("activity.moderate"))) {
      throw new Error("沒有權限刪除這筆");
    }
  }

  await db.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/app/activity/${expense.activity.id}`);
}
