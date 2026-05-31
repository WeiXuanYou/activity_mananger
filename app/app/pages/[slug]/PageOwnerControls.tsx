"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomPageAction, setPageCollabAction } from "@/modules/custom-pages/actions";

/**
 * Owner / page-admin controls on a custom page: toggle collaboration +
 * delete the whole page. Rendered only when the caller has decided the
 * current user is the owner or a page admin (page.publish); both server
 * actions re-check.
 */
export function PageOwnerControls({
  pageId,
  allowCollab,
  canToggleCollab,
  canDelete,
}: {
  pageId: string;
  allowCollab: boolean;
  canToggleCollab: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggleCollab = () => {
    startTransition(async () => {
      await setPageCollabAction(pageId, !allowCollab);
      router.refresh();
    });
  };

  const del = () => {
    if (!window.confirm("確定要刪除整個頁面嗎？這個動作無法復原。")) return;
    startTransition(async () => {
      const r = await deleteCustomPageAction(pageId);
      if (r.error) { alert(r.error); return; }
      router.push("/app/pages");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      {canToggleCollab && (
        <button
          type="button"
          onClick={toggleCollab}
          disabled={pending}
          title="開放 / 關閉協作編輯"
          className={`text-xs px-3 py-1.5 rounded-soft border transition disabled:opacity-50 ${
            allowCollab
              ? "bg-sage-soft/50 border-sage/40 text-sage-dark"
              : "bg-white border-sand text-ink/70 hover:bg-cream/40"
          }`}
        >
          {allowCollab ? "🤝 協作中" : "🤝 開放協作"}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={del}
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-terracotta-dark hover:bg-terracotta-soft/40 transition disabled:opacity-50"
        >
          🗑 刪除頁面
        </button>
      )}
    </div>
  );
}
