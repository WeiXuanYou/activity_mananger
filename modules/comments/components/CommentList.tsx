import { Avatar } from "@/modules/core/members";
import { findMember } from "@/modules/core/members";
import type { Comment } from "../types";
import { CommentDeleteButton } from "./CommentDeleteButton";

/**
 * Render a thread of comments. Author must have been pre-resolved on each
 * comment (`comment.author` from the DB adapter) — falls back to sync
 * mock lookup only for safety; production rendering shouldn't need it.
 */
export function CommentList({
  comments,
  currentUserId,
  canModerate,
}: {
  comments: Comment[];
  currentUserId: string;
  canModerate: boolean;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-ink/50 italic">還沒有留言。第一個吧 🌱</p>
    );
  }
  return (
    <div className="space-y-4">
      {comments.map((c) => {
        const author = c.author ?? findMember(c.authorId);
        const canDelete = canModerate || c.authorId === currentUserId;
        return (
          <div key={c.id} className="flex gap-3">
            <Avatar member={author} size={36} />
            <div className="flex-1 min-w-0">
              <div className="bg-cream/50 rounded-soft px-4 py-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-ink">{author.name}</span>
                  <span className="text-xs text-ink/40">{c.createdAt}</span>
                  {canDelete && (
                    <CommentDeleteButton commentId={c.id} />
                  )}
                </div>
                <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
