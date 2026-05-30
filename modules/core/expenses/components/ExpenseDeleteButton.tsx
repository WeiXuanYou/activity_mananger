"use client";
import { useTransition } from "react";
import { deleteExpenseAction } from "../actions";

export function ExpenseDeleteButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("刪除這筆支出？")) {
          startTransition(() => deleteExpenseAction(expenseId));
        }
      }}
      aria-label="刪除支出"
      className="text-ink/40 hover:text-terracotta text-sm disabled:opacity-50 w-5"
    >
      ✕
    </button>
  );
}
