import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewActivityForm, type ActivityPrefill } from "./NewActivityForm";

type Search = { searchParams: Promise<{ prefill?: string }> };

function decodePrefill(sp: { prefill?: string }): ActivityPrefill | undefined {
  if (!sp.prefill) return undefined;
  try {
    const json = Buffer.from(sp.prefill, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ActivityPrefill;
    if (parsed && Object.keys(parsed).length > 0) return parsed;
  } catch {
    // silently ignore malformed
  }
  return undefined;
}

export default async function NewActivityPage({ searchParams }: Search) {
  const me = await requireCurrentUser();
  const sp = await searchParams;
  const prefill = decodePrefill(sp);
  const categories = await listCategoriesDb();

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
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

      <NewActivityForm categories={categories} prefill={prefill} />
    </main>
  );
}
