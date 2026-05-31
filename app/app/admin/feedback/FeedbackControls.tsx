"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeedbackStatusAction, deleteFeedbackAction } from "@/modules/feedback/actions";

export function FeedbackControls({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      await setFeedbackStatusAction(id, !resolved);
      router.refresh();
    });
  };

  const del = () => {
    if (!window.confirm("刪除這則回饋？無法復原。")) return;
    startTransition(async () => {
      await deleteFeedbackAction(id);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`text-xs px-3 py-1.5 rounded-soft border transition disabled:opacity-50 ${
          resolved
            ? "bg-white border-sand text-ink/70 hover:bg-cream/40"
            : "bg-sage-soft/50 border-sage/40 text-sage-dark hover:bg-sage-soft/70"
        }`}
      >
        {pending ? "…" : resolved ? "↩ 標記未處理" : "✓ 標記已處理"}
      </button>
      <button
        type="button"
        onClick={del}
        disabled={pending}
        className="text-xs px-2 py-1.5 rounded-soft bg-white border border-sand text-terracotta-dark hover:bg-terracotta-soft/40 disabled:opacity-50"
      >
        🗑
      </button>
    </div>
  );
}
