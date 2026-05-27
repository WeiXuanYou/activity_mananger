import DOMPurify from "isomorphic-dompurify";
import { registerBlockRenderer } from "./registry";

/**
 * RichText block — pre-rendered HTML produced (today) by a static seed,
 * (later) by a WYSIWYG editor.
 *
 * Why is this separate from the `html` renderer? Conceptually richtext
 * is the "default text body" with editor-managed markup, while `html`
 * means "the user pasted raw HTML". They share sanitization but the UX
 * editing experience will diverge in Phase D+.
 */
registerBlockRenderer({
  type: "richtext",
  label: "📝 Rich Text",
  render: (data) => {
    const html = (data.html as string) ?? "";
    if (!html.trim()) {
      return <p className="text-ink/40 italic text-sm">（這個 RichText block 還是空的）</p>;
    }
    const clean = DOMPurify.sanitize(html);
    return (
      <div
        className="text-ink/85 leading-relaxed [&_h1]:serif [&_h2]:serif [&_h3]:serif [&_h1]:text-2xl [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:mb-1 [&_p]:my-2 [&_strong]:text-ink"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  },
});
