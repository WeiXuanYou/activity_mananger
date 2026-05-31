"use client";
import { useTransition } from "react";
import { deleteLodgingAction } from "@/modules/core/lodging/actions";

export function DeleteLodgingButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const onClick = () => {
    if (!window.confirm(`要移除「${name}」嗎？`)) return;
    startTransition(async () => {
      try { await deleteLodgingAction(id); }
      catch (e) { alert((e as Error).message ?? "刪除失敗"); }
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs px-2 py-1 rounded-soft bg-white border border-sand text-ink/60 hover:bg-cream/40 disabled:opacity-50"
    >
      {pending ? "刪除中…" : "🗑 移除"}
    </button>
  );
}
