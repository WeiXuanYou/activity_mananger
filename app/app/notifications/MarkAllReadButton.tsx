"use client";
import { useTransition } from "react";
import { markAllReadAction } from "@/modules/notifications";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => markAllReadAction())}
      className="text-sm px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 disabled:opacity-50"
    >
      {pending ? "處理中..." : "全部標為已讀"}
    </button>
  );
}
