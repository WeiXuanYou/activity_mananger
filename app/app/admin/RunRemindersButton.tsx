"use client";
/**
 * Admin "run reminders now" button. Calls the server action, shows the
 * summary inline, and refreshes the page so the recent-runs table picks
 * up the new entries.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runRemindersAdminAction } from "@/modules/core/reminders/actions";
import type { ReminderRunResult } from "@/modules/core/reminders";

export function RunRemindersButton() {
  const router = useRouter();
  const [result, setResult] = useState<ReminderRunResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await runRemindersAdminAction();
        setResult(r);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "執行失敗");
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "掃描中..." : "▶ 立刻跑一次"}
        </button>
        <span className="text-xs text-ink/55">
          掃描 26h 內 + 2.5h 內的活動，發送尚未通知過的
        </span>
      </div>

      {error && (
        <p className="mt-3 text-xs text-terracotta-dark bg-terracotta-soft/30 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      {result && (
        <div className="mt-3 rounded-soft border border-sage/30 bg-sage-soft/30 px-4 py-3 text-sm">
          <div className="font-medium text-sage-dark mb-1">
            ✓ 掃描了 {result.scannedActivities} 場 · 發了 {result.remindersSent} 個提醒 · 共 {result.notificationsCreated} 則通知
          </div>
          {result.details.length > 0 && (
            <ul className="text-xs text-ink/70 list-disc pl-5 mt-1 space-y-0.5">
              {result.details.map((d) => (
                <li key={`${d.activityId}-${d.tier}`}>
                  {d.tier === "DAY_BEFORE" ? "24h 前" : "2h 前"}：{d.activityTitle}（{d.userCount} 人）
                </li>
              ))}
            </ul>
          )}
          {result.scannedActivities === 0 && (
            <p className="text-xs text-ink/55 mt-1">最近 24h 內沒有要提醒的活動，下次再來看看。</p>
          )}
        </div>
      )}
    </div>
  );
}
