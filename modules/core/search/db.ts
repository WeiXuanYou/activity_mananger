/**
 * Phase J — cross-content search.
 *
 * Returns a single ranked list of hits across posts, activities, polls,
 * and pages. Uses Prisma's case-insensitive `contains` for now — fine
 * for the family-sized corpus. Future: swap to FTS5 (SQLite) or
 * Postgres `tsvector` without changing the call signature.
 *
 * Each hit carries:
 *   - kind / id / title / snippet (where the match was found)
 *   - href (deep link back to the content)
 *   - score (very rough — title matches > body matches; date breaks ties)
 */
import { db } from "@/lib/db";

export type SearchHitKind = "post" | "activity" | "poll" | "page" | "comment";

export type SearchHit = {
  kind: SearchHitKind;
  id: string;
  title: string;
  snippet: string;
  href: string;
  /** Higher = better. Used to sort the merged list. */
  score: number;
  /** ISO date string for the secondary sort. */
  createdAt: string;
};

const MAX_PER_KIND = 20;

/** SQLite + Prisma `contains` does case-INsensitive match by default for ASCII
 *  and code-point equal for CJK — so 中文搜尋 works without extra config. */
function bumpForTitleHit(hasTitleHit: boolean): number {
  return hasTitleHit ? 100 : 10;
}

function snippetAround(haystack: string | null, needle: string, ctx = 30): string {
  if (!haystack) return "";
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return haystack.slice(0, ctx * 2);
  const start = Math.max(0, idx - ctx);
  const end = Math.min(haystack.length, idx + needle.length + ctx);
  return (start > 0 ? "…" : "") + haystack.slice(start, end) + (end < haystack.length ? "…" : "");
}

/** Run the search. Pass a trimmed, non-empty query. */
export async function searchAll(q: string): Promise<SearchHit[]> {
  if (!q.trim()) return [];
  const needle = q.trim();

  // Posts — title or body
  const posts = await db.post.findMany({
    where: {
      OR: [{ title: { contains: needle } }, { body: { contains: needle } }],
    },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_KIND,
    select: { id: true, title: true, body: true, createdAt: true },
  });

  // Activities — title, description, location
  const activities = await db.activity.findMany({
    where: {
      OR: [
        { title: { contains: needle } },
        { description: { contains: needle } },
        { location: { contains: needle } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_KIND,
    select: { id: true, title: true, description: true, location: true, createdAt: true },
  });

  // Polls — question OR any option label
  const polls = await db.poll.findMany({
    where: {
      OR: [
        { question: { contains: needle } },
        { options: { some: { label: { contains: needle } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_KIND,
    select: {
      id: true, question: true, createdAt: true,
      options: { select: { label: true } },
    },
  });

  // Custom pages — title or excerpt
  const pages = await db.customPage.findMany({
    where: {
      OR: [
        { title: { contains: needle } },
        { excerpt: { contains: needle } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_KIND,
    select: { id: true, slug: true, title: true, excerpt: true, createdAt: true },
  });

  // Comments — body
  const comments = await db.comment.findMany({
    where: { body: { contains: needle } },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_KIND,
    select: { id: true, body: true, parentType: true, parentId: true, createdAt: true },
  });

  const hits: SearchHit[] = [];

  for (const p of posts) {
    const titleHit = p.title?.toLowerCase().includes(needle.toLowerCase()) ?? false;
    hits.push({
      kind: "post",
      id: p.id,
      title: p.title ?? "（無標題文章）",
      snippet: snippetAround(titleHit ? p.body : p.body || p.title, needle),
      href: "/app/feed",
      score: bumpForTitleHit(titleHit),
      createdAt: p.createdAt.toISOString(),
    });
  }

  for (const a of activities) {
    const titleHit = a.title.toLowerCase().includes(needle.toLowerCase());
    const where = titleHit ? a.description : a.description || a.location;
    hits.push({
      kind: "activity",
      id: a.id,
      title: a.title,
      snippet: snippetAround(where, needle),
      href: `/app/activity/${a.id}`,
      score: bumpForTitleHit(titleHit),
      createdAt: a.createdAt.toISOString(),
    });
  }

  for (const poll of polls) {
    const qHit = poll.question.toLowerCase().includes(needle.toLowerCase());
    // Show the matched option as snippet if the question didn't hit
    const matchedOpt = poll.options.find((o) =>
      o.label.toLowerCase().includes(needle.toLowerCase()),
    );
    hits.push({
      kind: "poll",
      id: poll.id,
      title: poll.question,
      snippet: qHit ? snippetAround(poll.question, needle) : `候選項目：${matchedOpt?.label ?? ""}`,
      href: `/app/poll/${poll.id}`,
      score: bumpForTitleHit(qHit),
      createdAt: poll.createdAt.toISOString(),
    });
  }

  for (const pg of pages) {
    const titleHit = pg.title.toLowerCase().includes(needle.toLowerCase());
    hits.push({
      kind: "page",
      id: pg.id,
      title: pg.title,
      snippet: snippetAround(pg.excerpt, needle),
      href: `/app/pages/${pg.slug}`,
      score: bumpForTitleHit(titleHit),
      createdAt: pg.createdAt.toISOString(),
    });
  }

  for (const c of comments) {
    // Build the right deep link by parent kind
    let href = "/app/feed";
    if (c.parentType === "ACTIVITY") href = `/app/activity/${c.parentId}`;
    if (c.parentType === "PAGE") {
      const page = await db.customPage.findUnique({
        where: { id: c.parentId },
        select: { slug: true },
      });
      if (page) href = `/app/pages/${page.slug}`;
    }
    hits.push({
      kind: "comment",
      id: c.id,
      title: `💬 一則留言`,
      snippet: snippetAround(c.body, needle),
      href,
      score: 5, // comments rank below first-class content
      createdAt: c.createdAt.toISOString(),
    });
  }

  // Sort: score desc, then date desc
  hits.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : b.createdAt.localeCompare(a.createdAt),
  );

  return hits;
}
