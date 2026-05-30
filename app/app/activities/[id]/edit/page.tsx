import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findActivityDb } from "@/modules/core/activities";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewActivityForm } from "../../new/NewActivityForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditActivityPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const activity = await findActivityDb(id);
  if (!activity) notFound();

  // Owner can edit own; activity.moderate can edit anyone's
  const canModerate = await canCurrentUser("activity.moderate");
  if (activity.hostId !== me.id && !canModerate) {
    redirect(`/app/activity/${id}?denied=edit`);
  }

  const categories = await listCategoriesDb();
  const categorySlugs = (activity.categories ?? [])
    .map((c) => c.slug)
    .filter(Boolean);

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href={`/app/activity/${id}`} className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回活動詳情
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ACTIVITIES · EDIT</p>
        <h1 className="serif text-3xl text-ink">編輯活動</h1>
      </div>
      <NewActivityForm
        categories={categories}
        editing={{
          id: activity.id,
          title: activity.title,
          description: activity.description,
          location: activity.location,
          // The DB shape stores startsAt as "YYYY-MM-DD HH:mm" — convert to
          // the "T"-separated form that <input type="datetime-local"> wants.
          startsAt: activity.startsAt.replace(" ", "T"),
          cover: activity.cover,
          categorySlugs,
        }}
      />
    </main>
  );
}
