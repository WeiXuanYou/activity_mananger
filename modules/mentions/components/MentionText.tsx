import Link from "next/link";
import { splitMentions } from "../parse";
import type { Member } from "@/modules/core/members";

/**
 * Render text with @mentions turned into links.
 *
 * `members` is an optional lookup of handle → member so we can (a) only
 * link real people and (b) point the link at their profile. Unknown
 * handles render as plain text (no dead links). Preserves whitespace via
 * the caller's wrapper (we don't add our own <p>).
 */
export function MentionText({
  text,
  membersByHandle,
}: {
  text: string;
  /** lowercased handle → member. Omit to render all mentions as plain text. */
  membersByHandle?: Map<string, Member>;
}) {
  const segments = splitMentions(text);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;
        const member = membersByHandle?.get(seg.handle);
        if (member) {
          return (
            <Link
              key={i}
              href={`/app/members/${member.id}`}
              className="text-terracotta font-medium hover:underline"
            >
              @{member.name}
            </Link>
          );
        }
        // No member map (or unknown handle): still highlight the @token so
        // mentions read as mentions, just without a link.
        return (
          <span key={i} className="text-terracotta font-medium">{seg.raw}</span>
        );
      })}
    </>
  );
}
