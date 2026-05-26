"use client";
import { useTransition } from "react";
import { approveRequestAction, rejectRequestAction } from "@/modules/permissions/actions";

export function AdminActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={pending}
        onClick={() => startTransition(() => approveRequestAction(requestId))}
        className="px-4 py-2 rounded-soft bg-sage text-white font-medium text-sm hover:bg-sage-dark transition disabled:opacity-50"
      >
        ✓ 核准
      </button>
      <button
        disabled={pending}
        onClick={() => startTransition(() => rejectRequestAction(requestId))}
        className="px-4 py-2 rounded-soft bg-white border border-sand text-ink/70 text-sm hover:bg-cream/40 disabled:opacity-50"
      >
        ✕ 拒絕
      </button>
      {pending && <span className="self-center text-xs text-ink/50">處理中...</span>}
    </div>
  );
}
