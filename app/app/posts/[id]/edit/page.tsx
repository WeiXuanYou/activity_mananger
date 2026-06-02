import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findPostDb } from "@/modules/core/posts";
import { listCategoriesDb } from "@/modules/core/categories";
import { EditPostForm } from "./EditPostForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const post = await findPostDb(id);
  if (!post) notFound();

  const [canModerate, canPin, categories] = await Promise.all([
    canCurrentUser("post.moderate"),
    canCurrentUser("post.pin"),
    listCategoriesDb(),
  ]);
  // Author + moderators always; collaborators when the author opted in.
  const isOwner = post.authorId === me.id;
  if (!isOwner && !canModerate && !post.allowCollab) redirect("/app/feed?denied=edit");
  // Only the owner / a moderator may flip the collab switch.
  const canToggleCollab = isOwner || canModerate;

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">POSTS · EDIT</p>
        <h1 className="serif text-3xl text-ink">編輯文章</h1>
        {!isOwner && post.allowCollab && (
          <p className="text-xs text-sage-dark bg-sage-soft/30 border border-sage/30 rounded-soft px-3 py-2 mt-2">
            🤝 這篇開放協作編輯——你的修改會直接套用。刪除 / 隱藏仍由原作者或管理員處理。
          </p>
        )}
      </div>
      <EditPostForm post={post} categories={categories} canPin={canPin} canToggleCollab={canToggleCollab} />
    </main>
  );
}
