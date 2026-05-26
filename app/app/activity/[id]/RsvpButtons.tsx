"use client";
import { useState, useTransition } from "react";
import { rsvpAction, type RsvpStatus } from "@/modules/core/activities/actions";

export function RsvpButtons({
  activityId,
  current,
  counts,
}: {
  activityId: string;
  current: RsvpStatus | null;
  counts: { going: number; maybe: number; declined: number };
}) {
  const [optimistic, setOptimistic] = useState<RsvpStatus | null>(current);
  const [pending, startTransition] = useTransition();

  const setStatus = (status: RsvpStatus) => {
    setOptimistic(status);
    startTransition(async () => {
      await rsvpAction(activityId, status);
    });
  };

  const cls = (s: RsvpStatus, base: string) =>
    `${base} ${optimistic === s ? "ring-2 ring-terracotta" : ""}`;

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <button
        onClick={() => setStatus("GOING")}
        disabled={pending}
        className={cls("GOING", "px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50")}
      >
        ✓ 我會去 ({counts.going})
      </button>
      <button
        onClick={() => setStatus("MAYBE")}
        disabled={pending}
        className={cls("MAYBE", "px-5 py-2.5 rounded-soft bg-white border border-sand text-ink hover:bg-cream/50 transition disabled:opacity-50")}
      >
        也許 ({counts.maybe})
      </button>
      <button
        onClick={() => setStatus("DECLINED")}
        disabled={pending}
        className={cls("DECLINED", "px-5 py-2.5 rounded-soft bg-white border border-sand text-ink/60 hover:bg-cream/50 transition disabled:opacity-50")}
      >
        無法參加 ({counts.declined})
      </button>
      {pending && <span className="self-center text-xs text-ink/50">寫入中...</span>}
      {!pending && optimistic && (
        <span className="self-center text-xs text-sage-dark">✓ 已記錄你的回覆</span>
      )}
    </div>
  );
}
