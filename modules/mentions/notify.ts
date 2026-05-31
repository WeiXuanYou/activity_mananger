import "server-only";
/**
 * Resolve @mentions in a piece of text to real users and notify them.
 * Fire-and-forget from the caller's perspective — mention failures must
 * never break posting / commenting.
 */
import { db } from "@/lib/db";
import { notify } from "@/modules/notifications";
import { extractMentions } from "./parse";

/**
 * Notify every existing user mentioned in `text` (except the author and
 * any ids in `excludeUserIds`, e.g. the content owner who already gets a
 * separate "new comment" notification).
 *
 * Returns the list of notified user ids (handy for tests / dedup).
 */
export async function notifyMentions(input: {
  text: string;
  authorId: string;
  authorName: string;
  title: string;
  link: string;
  excludeUserIds?: string[];
}): Promise<string[]> {
  const handles = extractMentions(input.text);
  if (handles.length === 0) return [];

  // Resolve handles → users. `handles` is already lowercased, and handles
  // are created lowercase at signup (validation.ts normalises them), so a
  // direct `in` match is correct without an expensive case-fold scan. We
  // query both the lowercased set and the original case forms to be safe
  // for any legacy mixed-case handle, but never load the whole table.
  const handleVariants = Array.from(new Set([...handles, ...handles.map((h) => h.toUpperCase())]));
  const candidates = await db.user.findMany({
    where: { handle: { in: handleVariants } },
    select: { id: true, handle: true },
  });

  const exclude = new Set([input.authorId, ...(input.excludeUserIds ?? [])]);
  const notified: string[] = [];
  for (const u of candidates) {
    if (exclude.has(u.id)) continue;
    // eslint-disable-next-line no-await-in-loop
    await notify({
      userId: u.id,
      kind: "mention",
      title: input.title,
      body: `${input.authorName} 在內容中提到你`,
      link: input.link,
    });
    notified.push(u.id);
  }
  return notified;
}
