import { registerBlockRenderer } from "./registry";

/**
 * Image block renderer.
 *
 * Phase D: accepts a URL (could be remote or `linear-gradient(...)` for a
 * placeholder color block). Phase D+: replace `<img>` with `next/image`
 * once we have proper file-upload + an image domain whitelist.
 *
 * `url` can also be a CSS gradient string (`linear-gradient(...)`); we
 * detect that and render a colour block instead of an img tag.
 */
registerBlockRenderer({
  type: "image",
  label: "🖼 圖片",
  render: (data) => {
    const url = (data.url as string) ?? "";
    const alt = (data.alt as string) ?? "";
    const caption = (data.caption as string) ?? "";
    const isGradient = url.startsWith("linear-gradient");

    if (!url) {
      return <p className="text-ink/40 italic text-sm">（圖片 block 還沒有來源）</p>;
    }

    return (
      <figure className="my-3">
        {isGradient ? (
          <div className="h-56 rounded-soft" style={{ background: url }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={alt}
            className="w-full rounded-soft border border-sand/60"
          />
        )}
        {caption && (
          <figcaption className="text-sm text-ink/60 italic mt-2 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  },
});
