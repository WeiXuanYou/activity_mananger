"use client";
import { useTransition } from "react";
import { deleteCommentAction } from "@/modules/comments/actions";

export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("確定要刪除這則留言？")) {
          startTransition(() => deleteCommentAction(commentId));
        }
      }}
      className="ml-auto text-[10px] text-ink/40 hover:text-terracotta disabled:opacity-50"
    >
      {pending ? "..." : "刪除"}
    </button>
  );
}
