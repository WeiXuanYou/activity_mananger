import { Avatar } from "@/modules/core/members";
import type { ExpenseSummary } from "../types";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseDeleteButton } from "./ExpenseDeleteButton";

/** Format integer cents as a localized currency string. */
function fmt(cents: number, currency: string): string {
  const value = cents / 100;
  // Use Intl for nice thousand separators; fall back if Intl chokes
  try {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function ExpensePanel({
  activityId,
  summary,
  currentUserId,
  hostId,
  canModerate,
}: {
  activityId: string;
  summary: ExpenseSummary;
  currentUserId: string;
  hostId: string;
  canModerate: boolean;
}) {
  const { expenses, totalCents, perPersonCents, participantCount, balances, currency } = summary;

  return (
    <section className="bg-white rounded-soft shadow-card border border-sand/60 p-4 sm:p-6 mb-6">
      <h2 className="serif text-lg sm:text-xl text-ink mb-4 flex items-center gap-2 flex-wrap">
        💰 結算 / 分帳
        {expenses.length > 0 && (
          <span className="text-sm text-ink/45 font-sans">({expenses.length} 筆)</span>
        )}
      </h2>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-soft bg-cream/40 px-3 py-2.5">
          <div className="text-xs text-ink/50">總花費</div>
          <div className="serif text-lg text-ink mt-0.5">{fmt(totalCents, currency)}</div>
        </div>
        <div className="rounded-soft bg-cream/40 px-3 py-2.5">
          <div className="text-xs text-ink/50">{participantCount > 0 ? `${participantCount} 人平分` : "尚無 RSVP"}</div>
          <div className="serif text-lg text-ink mt-0.5">{fmt(perPersonCents, currency)}</div>
        </div>
        <div className="rounded-soft bg-cream/40 px-3 py-2.5 col-span-2 sm:col-span-1">
          <div className="text-xs text-ink/50">分帳對象</div>
          <div className="text-sm text-ink mt-0.5">參加 + 也許參加</div>
        </div>
      </div>

      {/* Per-person balance */}
      {balances.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-ink/55 font-medium mb-2 tracking-wider">每人結算</div>
          <div className="space-y-2">
            {balances.map((b) => {
              const tone =
                b.net > 0 ? "text-sage-dark" : b.net < 0 ? "text-terracotta-dark" : "text-ink/55";
              const label =
                b.net > 0 ? "應收" : b.net < 0 ? "應付" : "持平";
              return (
                <div
                  key={b.userId}
                  className="flex items-center gap-3 rounded-soft px-3 py-2 bg-cream/30"
                >
                  <Avatar member={b.member} size={28} />
                  <span className="text-sm text-ink truncate">
                    {b.member.name}
                    {b.userId === currentUserId && (
                      <span className="ml-1.5 text-[10px] text-ink/40">（你）</span>
                    )}
                  </span>
                  <span className="ml-auto text-xs text-ink/55 hidden sm:inline">
                    付出 {fmt(b.paid, currency)} · 應分 {fmt(b.owes, currency)}
                  </span>
                  <span className={`text-sm font-medium ${tone} tabular-nums whitespace-nowrap`}>
                    {label} {fmt(Math.abs(b.net), currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense list */}
      {expenses.length > 0 ? (
        <div className="mb-5">
          <div className="text-xs text-ink/55 font-medium mb-2 tracking-wider">明細</div>
          <div className="rounded-soft border border-sand divide-y divide-sand bg-white overflow-hidden">
            {expenses.map((e) => {
              const canDelete =
                e.payerId === currentUserId || hostId === currentUserId || canModerate;
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar member={e.payer!} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink truncate">{e.description}</div>
                    <div className="text-[10px] text-ink/45">
                      {e.payer?.name} · {e.createdAtRelative}
                    </div>
                  </div>
                  <div className="text-sm text-ink tabular-nums">{fmt(e.amountCents, currency)}</div>
                  {canDelete && <ExpenseDeleteButton expenseId={e.id} />}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink/55 italic mb-5">還沒有人記支出。誰先掏錢誰先記吧 🙌</p>
      )}

      <ExpenseForm activityId={activityId} />

      <p className="text-[10px] text-ink/45 mt-3 leading-relaxed">
        v1：金額自動 <strong className="text-ink/65">平均分攤</strong>給 GOING + MAYBE 的人。改為按人指定金額的功能在後續 phase。
      </p>
    </section>
  );
}
