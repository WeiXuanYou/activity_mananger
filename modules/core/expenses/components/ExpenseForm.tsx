"use client";
import { useState, useTransition } from "react";
import { createExpenseAction } from "../actions";

/**
 * "I paid for X" form. Amount entered in whole currency units (e.g.
 * "1500"); converted to cents before sending. Always logs the current
 * user as the payer — we don't let people charge someone else.
 */
export function ExpenseForm({ activityId }: { activityId: string }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const value = Number(amount);
    if (!description.trim()) return setError("請填說明（買了什麼？）");
    if (!Number.isFinite(value) || value <= 0) return setError("金額要大於 0");
    startTransition(async () => {
      try {
        await createExpenseAction({
          activityId,
          description: description.trim(),
          amountCents: Math.round(value * 100),
        });
        setDescription("");
        setAmount("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "新增失敗");
      }
    });
  };

  return (
    <div className="rounded-soft border border-sand bg-cream/30 px-3 py-3">
      <div className="text-xs text-ink/55 font-medium mb-2 tracking-wider">記一筆我付的</div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="買了什麼？（例：飲料 + 點心）"
          className="flex-1 px-3 py-2 rounded-soft border border-sand bg-white text-sm focus:outline-none focus:border-terracotta"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額"
          inputMode="decimal"
          min="0"
          step="1"
          className="sm:w-32 px-3 py-2 rounded-soft border border-sand bg-white text-sm focus:outline-none focus:border-terracotta tabular-nums"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="sm:w-24 px-3 py-2 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "..." : "記下"}
        </button>
      </div>
      {error && <p className="text-xs text-terracotta-dark mt-2">⚠ {error}</p>}
    </div>
  );
}
