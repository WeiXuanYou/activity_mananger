"use client";
import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "../actions";

/**
 * Image upload field. Renders a labelled file picker, runs the upload
 * server action on change, then surfaces the resulting URL via `onUploaded`
 * and via the hidden field for direct form submission (`name="<name>"`).
 *
 * Preview is shown after a successful upload (or from `initialUrl` if you
 * pass one for editing flows later).
 */
export function ImageUpload({
  name,
  label = "圖片",
  initialUrl,
  onUploaded,
}: {
  name: string;
  label?: string;
  initialUrl?: string;
  onUploaded?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadImageAction(formData);
      if (result.ok) {
        setUrl(result.url);
        onUploaded?.(result.url);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <span className="text-sm font-medium text-ink/80 block mb-2">{label}</span>
      <input type="hidden" name={name} value={url ?? ""} />
      <div className="flex items-start gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="preview"
            className="w-32 h-32 object-cover rounded-soft border border-sand"
          />
        ) : (
          <div className="w-32 h-32 rounded-soft border-2 border-dashed border-sand bg-cream/30 flex items-center justify-center text-ink/40 text-3xl">
            🖼
          </div>
        )}
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onChange}
            disabled={pending}
            className="text-sm text-ink/70 file:mr-3 file:px-3 file:py-1.5 file:rounded-soft file:border-0 file:bg-cream file:text-ink/70 file:cursor-pointer file:hover:bg-sand/60"
          />
          {pending && <p className="text-xs text-ink/55 mt-2">上傳中...</p>}
          {error && <p className="text-xs text-terracotta-dark mt-2">⚠ {error}</p>}
          {url && !pending && (
            <p className="text-xs text-sage-dark mt-2">✓ 已上傳</p>
          )}
          <p className="text-xs text-ink/40 mt-2">JPG / PNG / WebP / GIF · 上限 5 MB</p>
        </div>
      </div>
    </div>
  );
}
