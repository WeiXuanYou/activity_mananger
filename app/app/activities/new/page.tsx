import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewActivityForm } from "./NewActivityForm";

export default async function NewActivityPage() {
  const me = await requireCurrentUser();
  const canCreate = await canCurrentUser("activity.create");
  if (!canCreate) redirect("/app/activities?denied=create");

  const categories = await listCategoriesDb();

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/app/activities" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回活動列表
      </Link>

      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ACTIVITIES · NEW</p>
        <h1 className="serif text-3xl text-ink">建立活動</h1>
        <p className="text-ink/60 text-sm mt-1">
          以 <strong className="text-ink/80">{me.name}</strong> 發起。建立後家人朋友可以 RSVP、留言。
        </p>
      </div>

      <NewActivityForm categories={categories} />
    </main>
  );
}
