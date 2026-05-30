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
  if (post.authorId !== me.id && !canModerate) redirect("/app/feed?denied=edit");

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">POSTS · EDIT</p>
        <h1 className="serif text-3xl text-ink">編輯文章</h1>
      </div>
      <EditPostForm post={post} categories={categories} canPin={canPin} />
    </main>
  );
}
