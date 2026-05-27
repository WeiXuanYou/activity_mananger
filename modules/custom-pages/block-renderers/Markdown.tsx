import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { registerBlockRenderer } from "./registry";

/**
 * Markdown block renderer.
 *
 * Uses react-markdown + remark-gfm (tables / strikethrough / task lists).
 * react-markdown is XSS-safe by default — it escapes raw HTML in the input
 * unless you opt in via rehype-raw, which we explicitly don't.
 *
 * Styling: a small set of `prose-*` overrides keeps the look consistent
 * with the rest of the app (serif headings + ink body).
 */
registerBlockRenderer({
  type: "markdown",
  label: "M↓ Markdown",
  render: (data) => {
    const source = (data.source as string) ?? "";
    if (!source.trim()) {
      return <p className="text-ink/40 italic text-sm">（這個 Markdown block 還是空的）</p>;
    }
    return (
      <div className="text-ink/85 leading-relaxed [&_h1]:serif [&_h2]:serif [&_h3]:serif [&_h1]:text-2xl [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-ink [&_a]:text-terracotta [&_a]:underline [&_code]:bg-cream/60 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-cream/60 [&_pre]:p-3 [&_pre]:rounded-soft [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-sand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink/65 [&_hr]:my-4 [&_hr]:border-sand [&_table]:my-3 [&_th]:bg-cream/40 [&_th]:p-2 [&_th]:font-medium [&_td]:p-2 [&_td]:border-t [&_td]:border-sand">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
      </div>
    );
  },
});
