import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewPollForm, type PollPrefill } from "./NewPollForm";

type Search = { searchParams: Promise<{ prefill?: string; q?: string; opts?: string }> };

/**
 * Prefill via URL: ?prefill=base64-json or the simpler ?q=...&opts=a|b|c.
 * Both forms supported — the AI assistant uses base64-json (preserves any
 * special chars), but the simpler form is convenient for hand-crafted links.
 */
function decodePrefill(sp: { prefill?: string; q?: string; opts?: string }): PollPrefill | undefined {
  if (sp.prefill) {
    try {
      const json = Buffer.from(sp.prefill, "base64url").toString("utf8");
      const parsed = JSON.parse(json) as PollPrefill;
      if (parsed && (parsed.question || parsed.options?.length)) return parsed;
    } catch {
      // fall through — silently ignore malformed prefill
    }
  }
  if (sp.q || sp.opts) {
    return {
      question: sp.q,
      options: sp.opts ? sp.opts.split("|").filter(Boolean) : undefined,
    };
  }
  return undefined;
}

export default async function NewPollPage({ searchParams }: Search) {
  const me = await requireCurrentUser();
  const sp = await searchParams;
  const prefill = decodePrefill(sp);
  const categories = await listCategoriesDb();

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
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

      <NewPollForm categories={categories} prefill={prefill} />
    </main>
  );
}
