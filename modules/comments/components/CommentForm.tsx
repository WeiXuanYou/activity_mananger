"use client";
import { useRef, useState, useTransition } from "react";
import type { Member } from "@/modules/core/members";
import { Avatar } from "@/modules/core/members";
import { createCommentAction } from "@/modules/comments/actions";
import type { CommentParentType } from "../types";

export function CommentForm({
  me,
  parentType,
  parentId,
}: {
  me: Member;
  parentType: CommentParentType;
  parentId: string;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCommentAction({ parentType, parentId, body });
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
        textareaRef.current?.blur();
      }
    });
  };

  return (
    <div className="pt-4 border-t border-sand">
      <div className="flex gap-3">
        <Avatar member={me} size={36} />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="寫一則留言..."
            rows={2}
            className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta text-sm resize-none"
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter to submit
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
          />
          {error && (
            <p className="mt-1 text-xs text-terracotta-dark">⚠ {error}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={submit}
              disabled={pending || !body.trim()}
              className="px-4 py-1.5 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
            >
              {pending ? "送出中..." : "留言"}
            </button>
            <span className="text-xs text-ink/40">⌘/Ctrl + Enter 也可送出</span>
          </div>
        </div>
      </div>
    </div>
  );
}
