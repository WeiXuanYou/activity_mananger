import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findPollDb } from "@/modules/core/polls";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewPollForm } from "../../new/NewPollForm";

type Params = { params: Promise<{ id: string }> };

/** Convert a full ISO datetime to the "YYYY-MM-DDTHH:mm" form datetime-local wants. */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditPollPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const poll = await findPollDb(id);
  if (!poll) notFound();

  const canModerate = await canCurrentUser("poll.moderate");
  if (poll.authorId !== me.id && !canModerate) redirect(`/app/poll/${id}?denied=edit`);

  const categories = await listCategoriesDb();
  const categorySlugs = (poll.categories ?? []).map((c) => c.slug).filter(Boolean);
  const hasVotes = poll.totalVotes > 0;

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href={`/app/poll/${id}`} className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回投票
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">POLLS · EDIT</p>
        <h1 className="serif text-3xl text-ink">編輯投票</h1>
      </div>
      <NewPollForm
        categories={categories}
        editing={{
          id: poll.id,
          question: poll.question,
          kind: poll.kind,
          options: poll.options.map((o) => o.label),
          multiSelect: poll.multiSelect,
          anonymous: poll.anonymous,
          allowAddOption: poll.allowAddOption,
          closesAt: toDatetimeLocal(poll.closesAtIso),
          categorySlugs,
          hasVotes,
        }}
      />
    </main>
  );
}
