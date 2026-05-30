/**
 * "On this day" — surface posts and activities from the same MM-DD in
 * previous years. Used as a small widget on /app/feed so the family sees
 * "去年的今天" / "兩年前的今天" without searching for it.
 *
 * The query: posts.createdAt and activities.startsAt where MM-DD matches
 * today's MM-DD AND the year is strictly less than this year. SQLite
 * doesn't have a clean date_part — we range-scan within each prior year
 * (cheap given dataset size; <10 years × small index = nothing).
 */
import { db } from "@/lib/db";

export type Memory =
  | { kind: "post";     id: string; title: string;  snippet: string; year: number; href: string }
  | { kind: "activity"; id: string; title: string;  snippet: string; year: number; href: string };

const HOW_MANY_YEARS = 5;

export async function listMemoriesForToday(): Promise<Memory[]> {
  const now = new Date();
  const month = now.getMonth();          // 0-indexed
  const day = now.getDate();
  const currentYear = now.getFullYear();

  const memories: Memory[] = [];

  for (let yearsAgo = 1; yearsAgo <= HOW_MANY_YEARS; yearsAgo++) {
    const year = currentYear - yearsAgo;
    const dayStart = new Date(year, month, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

    const [posts, activities] = await Promise.all([
      db.post.findMany({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
        select: { id: true, title: true, body: true },
        take: 3,
      }),
      db.activity.findMany({
        where: { startsAt: { gte: dayStart, lte: dayEnd } },
        select: { id: true, title: true, description: true },
        take: 3,
      }),
    ]);

    for (const p of posts) {
      memories.push({
        kind: "post",
        id: p.id,
        title: p.title ?? "（無標題文章）",
        snippet: p.body.slice(0, 80) + (p.body.length > 80 ? "…" : ""),
        year,
        href: "/app/feed",
      });
    }
    for (const a of activities) {
      memories.push({
        kind: "activity",
        id: a.id,
        title: a.title,
        snippet: a.description.slice(0, 80) + (a.description.length > 80 ? "…" : ""),
        year,
        href: `/app/activity/${a.id}`,
      });
    }
  }

  // Newest year first ("去年" before "三年前")
  memories.sort((a, b) => b.year - a.year);
  return memories;
}
