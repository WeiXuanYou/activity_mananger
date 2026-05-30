import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewPollForm } from "./NewPollForm";

export default async function NewPollPage() {
  const me = await requireCurrentUser();
  const canCreate = await canCurrentUser("poll.create");
  if (!canCreate) redirect("/app/feed?denied=create_poll");

  const categories = await listCategoriesDb();

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/app/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回動態
      </Link>

      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">POLLS · NEW</p>
        <h1 className="serif text-3xl text-ink">起一個投票</h1>
        <p className="text-ink/60 text-sm mt-1">
          以 <strong className="text-ink/80">{me.name}</strong> 發起。Line 風格——支援多選、匿名、家人可新增選項。
        </p>
      </div>

      <NewPollForm categories={categories} />
    </main>
  );
}
