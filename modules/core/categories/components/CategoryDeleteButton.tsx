"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "../actions";

/**
 * Delete control for a category. Rendered ONLY when the caller has decided
 * the current user may delete it (admin, or the creator) — the server
 * action re-checks regardless.
 */
export function CategoryDeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (!window.confirm(`要刪除分類「${name}」嗎？內容不會被刪除，只是會少掉這個標籤。`)) return;
    startTransition(async () => {
      const r = await deleteCategoryAction(id);
      if (r.error) alert(r.error);
      else router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs px-2 py-1 rounded-soft bg-white border border-sand text-terracotta-dark hover:bg-terracotta-soft/40 disabled:opacity-50"
    >
      {pending ? "刪除中…" : "🗑 刪除"}
    </button>
  );
}
