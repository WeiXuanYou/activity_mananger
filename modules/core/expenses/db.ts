/**
 * Phase K — expense queries.
 *
 * `getActivityExpenseSummary` is the only consumer-facing helper. It
 * pulls every expense for an activity + the participants (GOING+MAYBE),
 * then computes per-person paid/owes/net in JS. Splits are equal.
 *
 * Why GOING+MAYBE only:
 *   Excluding declines is conservative — they didn't show up, so we
 *   don't make them pay. MAYBE is treated as "intended to come" — most
 *   family chats roll that way.
 */
import { db } from "@/lib/db";
import { prismaUserToMember } from "@/modules/core/members";
import type { Expense, ExpenseSummary, Balance } from "./types";

type UserWithRole = {
  id: string; name: string; handle: string;
  avatarColor: string; initial: string;
  role: { name: string };
};

type ExpenseRow = {
  id: string;
  activityId: string;
  payerId: string;
  payer: UserWithRole;
  description: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString("zh-TW");
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    activityId: row.activityId,
    payerId: row.payerId,
    payer: prismaUserToMember(row.payer),
    description: row.description,
    amountCents: row.amountCents,
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    createdAtRelative: relativeTime(row.createdAt),
  };
}

export async function getActivityExpenseSummary(activityId: string): Promise<ExpenseSummary> {
  const [expenseRows, participants] = await Promise.all([
    db.expense.findMany({
      where: { activityId },
      orderBy: { createdAt: "asc" },
      include: { payer: { include: { role: { select: { name: true } } } } },
    }),
    db.activityParticipant.findMany({
      where: { activityId, status: { in: ["GOING", "MAYBE"] } },
      include: { user: { include: { role: { select: { name: true } } } } },
    }),
  ]);

  const expenses = expenseRows.map(toExpense);
  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const participantCount = participants.length;
  // Avoid divide-by-zero — if nobody RSVPed yet, the owner pays everything
  const perPersonCents = participantCount > 0 ? Math.round(totalCents / participantCount) : totalCents;
  const currency = expenses[0]?.currency ?? "TWD";

  // Build a balance entry for every participant (even if they paid 0)
  const balances: Balance[] = participants.map((p) => {
    const paid = expenses
      .filter((e) => e.payerId === p.userId)
      .reduce((sum, e) => sum + e.amountCents, 0);
    return {
      userId: p.userId,
      member: prismaUserToMember(p.user),
      paid,
      owes: perPersonCents,
      net: paid - perPersonCents,
    };
  });

  // Also include payers who weren't in participants (edge case — a person
  // dropped after paying). Otherwise their money disappears from the
  // summary entirely.
  const payerIdsNotInBalances = new Set(
    expenses
      .filter((e) => !balances.some((b) => b.userId === e.payerId))
      .map((e) => e.payerId),
  );
  for (const payerId of payerIdsNotInBalances) {
    const e = expenses.find((x) => x.payerId === payerId)!;
    const paid = expenses.filter((x) => x.payerId === payerId).reduce((s, x) => s + x.amountCents, 0);
    balances.push({
      userId: payerId,
      member: e.payer!,
      paid,
      owes: 0,
      net: paid, // they paid but aren't on the split — full refund owed
    });
  }

  // Sort balances: people owed money first, then by name
  balances.sort((a, b) => b.net - a.net);

  return {
    expenses,
    totalCents,
    perPersonCents,
    participantCount,
    currency,
    balances,
  };
}
