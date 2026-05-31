import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findPostDb, PostCard } from "@/modules/core/posts";
import { deletePostAction, setPostHiddenAction } from "@/modules/core/posts/actions";
import { getReactionSummaryDb } from "@/modules/reactions";
import { listCommentsDb, CommentList, CommentForm } from "@/modules/comments";
import { OwnerActions } from "@/modules/core/components/OwnerActions";

type Params = { params: Promise<{ id: string }> };

/**
 * Post detail page — the home of a post's comment thread.
 *
 * Before this existed, posts had a comment COUNT in the feed but nowhere
 * to actually read/write comments (only activities had a detail page). This
 * closes that gap: the feed's 💬 links here, and the full comment UI lives
 * at the bottom, exactly like the activity detail page.
 */
export default async function PostDetailPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();

  const post = await findPostDb(id);
  if (!post) notFound();

  const [reactionSummary, comments, canModerateComments, canModeratePosts] = await Promise.all([
    getReactionSummaryDb("POST", post.id, me.id),
    listCommentsDb("POST", post.id),
    canCurrentUser("comment.moderate"),
    canCurrentUser("post.moderate"),
  ]);

  const isOwnerOrMod = canModeratePosts || post.authorId === me.id;

  const meMember = {
    id: me.id, name: me.name, handle: me.handle,
    role: me.role.name as "Guest" | "Member" | "Editor" | "Admin",
    avatarColor: me.avatarColor, initial: me.initial,
    avatarImage: me.avatarImage ?? null,
  };

  const onDelete = async () => {
    "use server";
    await deletePostAction(post.id);
  };
  const onToggleHidden = async (next: boolean) => {
    "use server";
    await setPostHiddenAction(post.id, next);
  };

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>

      {post.hiddenAt && (
        <div className="mb-4 rounded-soft border border-sand bg-cream/60 px-4 py-3 text-sm text-ink/70 flex items-center gap-2">
          <span>🙈</span>
          <span>這篇文章已被隱藏，只有作者和管理員看得到。</span>
        </div>
      )}

      <div className="mb-6">
        <PostCard
          post={post}
          reactionSummary={reactionSummary}
          showCommentLink={false}
          ownerActions={
            isOwnerOrMod ? (
              <OwnerActions
                editHref={`/app/posts/${post.id}/edit`}
                onDelete={onDelete}
                onToggleHidden={onToggleHidden}
                hidden={Boolean(post.hiddenAt)}
                redirectTo="/app/feed"
              />
            ) : post.allowCollab ? (
              <Link
                href={`/app/posts/${post.id}/edit`}
                title="協作編輯"
                className="w-8 h-8 rounded-full text-ink/40 hover:text-ink hover:bg-cream/70 transition flex items-center justify-center text-sm"
              >
                ✎
              </Link>
            ) : undefined
          }
        />
      </div>

      <section className="bg-white rounded-soft shadow-card border border-sand/60 p-4 sm:p-6">
        <h2 className="serif text-lg sm:text-xl text-ink mb-4 flex items-center gap-2">
          💬 留言
          <span className="text-sm text-ink/40 font-sans">({comments.length})</span>
        </h2>
        <div className="mb-5">
          <CommentList
            comments={comments}
            currentUserId={me.id}
            canModerate={canModerateComments}
            parentType="POST"
            parentId={post.id}
            meMember={meMember}
          />
        </div>
        <CommentForm me={meMember} parentType="POST" parentId={post.id} />
      </section>

      <div className="mt-4 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        留言會立即送出並通知作者；用 <code className="text-terracotta">@帳號</code> 可以標記某人。
      </div>
    </main>
  );
}
