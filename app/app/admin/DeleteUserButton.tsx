"use client";
import { useTransition } from "react";
import { deleteUserAction } from "@/modules/permissions/admin";

/**
 * Tiny "🗑 移除" affordance for the admin member list. Two-step confirm
 * via window.confirm — we deliberately spell out what'll be wiped so an
 * admin can't blow away grandma's whole feed by accident.
 */
export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const onClick = () => {
    const ok = window.confirm(
      `要永久移除「${name}」嗎？\n\n` +
      `他發過的所有文章、活動、投票、留言、自訂頁面都會一起刪除，無法復原。`,
    );
    if (!ok) return;
    startTransition(async () => {
      try { await deleteUserAction(userId); }
      catch (e) { alert((e as Error).message ?? "刪除失敗"); }
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs px-2 py-1 rounded-soft bg-white border border-terracotta/40 text-terracotta-dark hover:bg-terracotta-soft/30 disabled:opacity-50"
      title="永久刪除帳號"
    >
      {pending ? "刪除中…" : "🗑 移除"}
    </button>
  );
}
