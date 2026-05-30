"use client";
/**
 * One comment row. Three modes:
 *   - Default: avatar + author + body + (回覆 / 編輯 / 刪除 actions)
 *   - Editing: textarea + 儲存 / 取消
 *   - Replying: inline mini-form under the comment, auto-focuses
 *
 * Replies and edits both round-trip through server actions and rely on
 * the parent page's revalidatePath to refresh — no client cache to keep
 * in sync.
 */
import { useState, useRef, useTransition, useEffect } from "react";
import { Avatar, findMember, type Member } from "@/modules/core/members";
import { createCommentAction, editCommentAction, deleteCommentAction } from "../actions";
import type { Comment, CommentParentType } from "../types";

export function CommentItem({
  comment,
  currentUserId,
  canModerate,
  parentType,
  parentId,
  meMember,
  isReply = false,
  replyAnchorId,
}: {
  comment: Comment;
  currentUserId: string;
  canModerate: boolean;
  parentType: CommentParentType;
  parentId: string;
  meMember: Member;
  isReply?: boolean;
  /** When this row is itself a reply, replying to it should anchor under
   *  the same root (not nest deeper). Caller passes the root id here. */
  replyAnchorId?: string;
}) {
  const author = comment.author ?? findMember(comment.authorId);
  const isOwn = comment.authorId === currentUserId;
  const canDelete = canModerate || isOwn;
  const canEdit = isOwn; // edit is owner-only by design

  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex gap-3">
      <Avatar member={author} size={isReply ? 28 : 36} />
      <div className="flex-1 min-w-0">
        {mode === "edit" ? (
          <EditForm
            initial={comment.body}
            pending={pending}
            error={error}
            onCancel={() => { setMode("view"); setError(null); }}
            onSave={(body) => {
              setError(null);
              startTransition(async () => {
                const r = await editCommentAction({ id: comment.id, body });
                if (r.error) setError(r.error);
                else setMode("view");
              });
            }}
          />
        ) : (
          <div className="bg-cream/50 rounded-soft px-4 py-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium text-ink">{author.name}</span>
              <span className="text-xs text-ink/40">{comment.createdAt}</span>
              <div className="ml-auto flex items-center gap-2">
                {!isReply && mode === "view" && (
                  <button
                    type="button"
                    onClick={() => setMode("reply")}
                    className="text-[10px] text-ink/55 hover:text-terracotta"
                  >
                    回覆
                  </button>
                )}
                {canEdit && mode === "view" && (
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="text-[10px] text-ink/55 hover:text-terracotta"
                  >
                    編輯
                  </button>
                )}
                {canDelete && mode === "view" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm("確定要刪除這則留言？" + (isReply ? "" : "回覆也會一起刪掉。"))) {
                        startTransition(() => deleteCommentAction(comment.id));
                      }
                    }}
                    className="text-[10px] text-ink/40 hover:text-terracotta-dark"
                  >
                    刪除
                  </button>
                )}
              </div>
            </div>
            <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </p>
          </div>
        )}

        {mode === "reply" && (
          <div className="mt-2">
            <ReplyForm
              me={meMember}
              replyingTo={author.name}
              onCancel={() => setMode("view")}
              parentType={parentType}
              parentId={parentId}
              parentCommentId={replyAnchorId ?? comment.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EditForm({
  initial,
  pending,
  error,
  onCancel,
  onSave,
}: {
  initial: string;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (body: string) => void;
}) {
  const [body, setBody] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  // Autofocus + place caret at end on open
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <div className="bg-cream/50 rounded-soft px-4 py-3">
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-soft border border-sand bg-white focus:outline-none focus:border-terracotta text-sm resize-none"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSave(body);
          if (e.key === "Escape") onCancel();
        }}
      />
      {error && <p className="text-xs text-terracotta-dark mt-1">⚠ {error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => onSave(body)}
          disabled={pending || !body.trim() || body === initial}
          className="px-3 py-1 rounded-soft bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "..." : "儲存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded-soft text-xs text-ink/60 hover:bg-cream"
        >
          取消
        </button>
        <span className="text-[10px] text-ink/40 ml-1">⌘+Enter / ESC</span>
      </div>
    </div>
  );
}

function ReplyForm({
  me,
  replyingTo,
  onCancel,
  parentType,
  parentId,
  parentCommentId,
}: {
  me: Member;
  replyingTo: string;
  onCancel: () => void;
  parentType: CommentParentType;
  parentId: string;
  parentCommentId: string;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await createCommentAction({ parentType, parentId, body, parentCommentId });
      if (r.error) setError(r.error);
      else { setBody(""); onCancel(); }
    });
  };

  return (
    <div className="flex gap-2">
      <Avatar member={me} size={28} />
      <div className="flex-1">
        <textarea
          ref={ref}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`回覆 @${replyingTo}...`}
          rows={2}
          className="w-full px-3 py-2 rounded-soft border border-sand bg-white focus:outline-none focus:border-terracotta text-sm resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
        />
        {error && <p className="text-xs text-terracotta-dark mt-1">⚠ {error}</p>}
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={submit}
            disabled={pending || !body.trim()}
            className="px-3 py-1 rounded-soft bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
          >
            {pending ? "..." : "送出"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 rounded-soft text-xs text-ink/60 hover:bg-cream"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
