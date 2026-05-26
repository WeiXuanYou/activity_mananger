/**
 * Real "create post" page. Server component fetches categories;
 * NewPostForm is the client form that calls the server action.
 */
import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewPostForm } from "./NewPostForm";

export default async function NewPostPage() {
  const me = await requireCurrentUser();
  const [categories, canPin] = await Promise.all([
    listCategoriesDb(),
    canCurrentUser("post.pin"),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>

      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">REAL DB · WRITE</p>
        <h1 className="serif text-3xl text-ink">寫一篇文章</h1>
        <p className="text-ink/60 text-sm mt-1">
          以 <strong className="text-ink/80">{me.name}</strong> 發布 ·
          {canPin ? " 你有置頂權限" : " 置頂需要 Editor 權限"}
        </p>
      </div>

      <NewPostForm categories={categories} canPin={canPin} />
    </main>
  );
}
