import DOMPurify from "isomorphic-dompurify";
import { registerBlockRenderer } from "./registry";

/**
 * Raw HTML block renderer.
 *
 * **Security**: input is run through DOMPurify with a conservative allow-list
 * before being passed to dangerouslySetInnerHTML. This prevents stored XSS
 * from <script>, on-* event handlers, javascript: URLs, etc.
 *
 * DOMPurify works on both the server (using jsdom under isomorphic-dompurify)
 * and the client, so the same call site is safe in either rendering mode.
 *
 * If a tighter or looser policy is needed, override `ALLOWED_TAGS` /
 * `ALLOWED_ATTR` here — keep the policy centralised in this file.
 */
registerBlockRenderer({
  type: "html",
  label: "</> HTML",
  render: (data) => {
    const source = (data.source as string) ?? "";
    if (!source.trim()) {
      return <p className="text-ink/40 italic text-sm">（這個 HTML block 還是空的）</p>;
    }
    const clean = DOMPurify.sanitize(source, {
      // No <script>, no <iframe>, no on-* handlers, no <style> by default.
      // Most semantic HTML + basic formatting tags allowed.
      ALLOWED_TAGS: [
        "p", "br", "hr", "strong", "em", "u", "s", "code", "pre",
        "a", "img", "ul", "ol", "li", "blockquote",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "table", "thead", "tbody", "tr", "th", "td",
        "div", "span",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
      ALLOW_DATA_ATTR: false,
    });
    return (
      <div
        className="text-ink/85 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  },
});
