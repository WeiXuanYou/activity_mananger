import type { Comment, CommentParentType } from "../types";
import { CommentItem } from "./CommentItem";
import type { Member } from "@/modules/core/members";

/**
 * Threaded list of comments. Receives the flat list from `listCommentsDb`
 * and groups replies under their top-level parent. One level of nesting:
 * grandchild-of-grandchild renders at reply-depth (no infinite indent).
 * Matches the LINE / Facebook UX expectation that families know.
 */
export function CommentList({
  comments,
  currentUserId,
  canModerate,
  parentType,
  parentId,
  meMember,
}: {
  comments: Comment[];
  currentUserId: string;
  canModerate: boolean;
  parentType: CommentParentType;
  parentId: string;
  meMember: Member;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-ink/50 italic">還沒有留言。第一個吧 🌱</p>
    );
  }

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const byId = new Map(comments.map((c) => [c.id, c]));
  const rootIdOf = (c: Comment): string => {
    let cur: Comment | undefined = c;
    while (cur?.parentCommentId) cur = byId.get(cur.parentCommentId);
    return cur?.id ?? c.id;
  };
  const repliesByRoot = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.parentCommentId) continue;
    const rootId = rootIdOf(c);
    if (!repliesByRoot.has(rootId)) repliesByRoot.set(rootId, []);
    repliesByRoot.get(rootId)!.push(c);
  }

  return (
    <div className="space-y-5">
      {topLevel.map((c) => {
        const replies = repliesByRoot.get(c.id) ?? [];
        return (
          <div key={c.id}>
            <CommentItem
              comment={c}
              currentUserId={currentUserId}
              canModerate={canModerate}
              parentType={parentType}
              parentId={parentId}
              meMember={meMember}
            />
            {replies.length > 0 && (
              <div className="ml-10 mt-3 space-y-3 border-l-2 border-sand pl-4">
                {replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    currentUserId={currentUserId}
                    canModerate={canModerate}
                    parentType={parentType}
                    parentId={parentId}
                    meMember={meMember}
                    isReply
                    /** Reply-to-reply lands under the root, not nested deeper */
                    replyAnchorId={c.id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
