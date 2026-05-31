/**
 * @mention parsing — pure, no I/O. Shared by the notify path (server) and
 * the renderer (client/server).
 *
 * A mention is `@` followed by a handle: letters, digits, underscore, and
 * hyphen (matches the handle charset used at signup). We deliberately keep
 * it ASCII — handles are ASCII — so we don't accidentally swallow a CJK
 * sentence after a stray "@".
 */

/** Matches `@handle`. Capture group 1 = the handle (without the @). */
export const MENTION_RE = /@([a-zA-Z0-9_-]{2,40})/g;

/** Extract the unique, lowercased handles mentioned in a body of text. */
export function extractMentions(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) {
    out.add(m[1].toLowerCase());
  }
  return Array.from(out);
}

/** A segment of parsed text — either plain text or a resolved mention. */
export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; handle: string; raw: string };

/**
 * Split text into plain / mention segments for rendering. Every `@token`
 * becomes a mention segment regardless of whether the handle exists — the
 * renderer decides how to display unknown handles (we render them as plain
 * text to avoid dead links).
 */
export function splitMentions(text: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ type: "text", value: text.slice(last, idx) });
    segments.push({ type: "mention", handle: m[1].toLowerCase(), raw: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}
