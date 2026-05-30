import sanitizeHtml from "sanitize-html";
import { registerBlockRenderer } from "./registry";

/**
 * Raw HTML block renderer.
 *
 * **Security**: input is run through `sanitize-html` with a conservative
 * allow-list before being passed to dangerouslySetInnerHTML. This
 * prevents stored XSS from <script>, on-* event handlers, javascript:
 * URLs, etc.
 *
 * `sanitize-html` is a small server-side-friendly sanitizer; it avoids
 * pulling jsdom into the bundle (isomorphic-dompurify's transitive
 * dependency, which has been a source of CJS/ESM interop errors).
 *
 * If a tighter or looser policy is needed, override `allowedTags` /
 * `allowedAttributes` here — keep the policy centralised in this file.
 */
const HTML_ALLOWED = {
  // No <script>, <iframe>, on-* handlers, or <style>. Most semantic
  // HTML + basic formatting tags allowed.
  allowedTags: [
    "p", "br", "hr",
    "strong", "em", "u", "s", "code", "pre", "mark",
    "a", "img",
    "ul", "ol", "li",
    "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Don't drop empty allowed tags — let formatting like <br> survive
  selfClosing: ["br", "hr", "img"],
} satisfies sanitizeHtml.IOptions;

registerBlockRenderer({
  type: "html",
  label: "</> HTML",
  render: (data) => {
    const source = (data.source as string) ?? "";
    if (!source.trim()) {
      return <p className="text-ink/40 italic text-sm">（這個 HTML block 還是空的）</p>;
    }
    const clean = sanitizeHtml(source, HTML_ALLOWED);
    return (
      <div
        className="text-ink/85 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  },
});
