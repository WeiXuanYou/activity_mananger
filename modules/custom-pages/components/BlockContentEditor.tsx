"use client";
/**
 * Inline content editor for text + image blocks (markdown / richtext /
 * html / image). Visible only in edit mode — the page detail decides who
 * sees it based on ownership / page.publish.
 *
 * Why this exists: before this, the ONLY block with an inline editor was
 * `photo-album`. Adding a markdown / richtext / html / image block dropped
 * a placeholder ("## 新段落…") with no way to change it — so "編輯頁面"
 * couldn't actually add real content. This closes that gap for every
 * text-ish block type.
 *
 * Persists with the same `updateBlockDataAction` the album editor uses.
 * Edits are committed on blur / explicit 儲存 (not every keystroke) to
 * avoid hammering the server action while typing.
 */
import { useState, useTransition } from "react";
import { uploadImageAction } from "@/modules/uploads/actions";
import { updateBlockDataAction } from "../actions";
import type { BlockData, BlockType } from "../types";

/** Per-type config: which field holds the text, and the editor copy. */
const TEXT_FIELD: Partial<Record<BlockType, { field: "source" | "html"; label: string; hint: string; mono: boolean }>> = {
  markdown: { field: "source", label: "Markdown 內容", hint: "支援標準 Markdown + GFM（表格、待辦清單、刪除線）", mono: true },
  richtext: { field: "html",   label: "內容（HTML）",   hint: "可貼入 HTML；渲染時會自動 sanitize", mono: true },
  html:     { field: "source", label: "HTML 原始碼",    hint: "渲染時會自動 sanitize 不安全標籤", mono: true },
};

export function BlockContentEditor({
  blockId,
  type,
  data,
}: {
  blockId: string;
  type: BlockType;
  data: BlockData;
}) {
  if (type === "image") {
    return <ImageBlockEditor blockId={blockId} data={data} />;
  }
  const cfg = TEXT_FIELD[type];
  if (!cfg) return null; // photo-album handled elsewhere; embed-poll below
  if (type === "embed-poll") return null;
  return <TextBlockEditor blockId={blockId} data={data} cfg={cfg} />;
}

function TextBlockEditor({
  blockId,
  data,
  cfg,
}: {
  blockId: string;
  data: BlockData;
  cfg: { field: "source" | "html"; label: string; hint: string; mono: boolean };
}) {
  const initial = typeof data[cfg.field] === "string" ? (data[cfg.field] as string) : "";
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");
  const [, startTransition] = useTransition();

  const dirty = value !== initial;

  const commit = () => {
    if (!dirty) return;
    setSaved("saving");
    startTransition(async () => {
      // Preserve any sibling fields on the block (alt/caption/etc.)
      await updateBlockDataAction(blockId, { ...data, [cfg.field]: value });
      setSaved("done");
    });
  };

  return (
    <div className="mt-3 rounded-soft border border-sage/30 bg-cream/40 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-ink/70">{cfg.label}</span>
        {saved === "saving" && <span className="text-[10px] text-ink/45">儲存中…</span>}
        {saved === "done" && !dirty && <span className="text-[10px] text-sage-dark">✓ 已儲存</span>}
        {dirty && <span className="text-[10px] text-terracotta-dark ml-auto">未儲存</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved("idle"); }}
        onBlur={commit}
        rows={8}
        className={`w-full px-3 py-2 rounded-soft border border-sand bg-white focus:outline-none focus:border-terracotta text-sm resize-y ${cfg.mono ? "font-mono" : ""}`}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={commit}
          disabled={!dirty}
          className="px-3 py-1.5 rounded-soft bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark transition disabled:opacity-40"
        >
          儲存內容
        </button>
        <span className="text-[10px] text-ink/45">{cfg.hint}</span>
      </div>
    </div>
  );
}

function ImageBlockEditor({ blockId, data }: { blockId: string; data: BlockData }) {
  const [url, setUrl] = useState(typeof data.url === "string" ? (data.url as string) : "");
  const [caption, setCaption] = useState(typeof data.caption === "string" ? (data.caption as string) : "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");
  const [, startTransition] = useTransition();

  const persist = (next: { url?: string; caption?: string }) => {
    const nextData = {
      ...data,
      url: next.url ?? url,
      caption: next.caption ?? caption,
    };
    setSaved("saving");
    startTransition(async () => {
      await updateBlockDataAction(blockId, nextData);
      setSaved("done");
    });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const r = await uploadImageAction(fd);
    setUploading(false);
    if (r.ok) {
      setUrl(r.url);
      persist({ url: r.url });
    } else {
      setError(r.error);
    }
  };

  const isGradient = url.startsWith("linear-gradient");

  return (
    <div className="mt-3 rounded-soft border border-sage/30 bg-cream/40 p-3 space-y-3">
      <div className="flex items-start gap-3">
        {url ? (
          isGradient ? (
            <div className="w-24 h-24 rounded-soft border border-sand shrink-0" style={{ background: url }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={caption} className="w-24 h-24 object-cover rounded-soft border border-sand shrink-0" />
          )
        ) : (
          <div className="w-24 h-24 rounded-soft border-2 border-dashed border-sand bg-white/50 flex items-center justify-center text-2xl text-ink/30 shrink-0">🖼</div>
        )}
        <div className="flex-1 min-w-0">
          <label className="cursor-pointer inline-block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }}
              className="hidden"
            />
            <span className="px-3 py-1.5 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition inline-block">
              {uploading ? "上傳中…" : url ? "更換圖片" : "上傳圖片"}
            </span>
          </label>
          {error && <p className="text-xs text-terracotta-dark mt-2">⚠ {error}</p>}
          {saved === "done" && <p className="text-[10px] text-sage-dark mt-2">✓ 已儲存</p>}
          <p className="text-[10px] text-ink/45 mt-2">JPG / PNG / WebP / GIF · 上限 5 MB</p>
        </div>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-ink/70">圖說（可選）</span>
        <input
          value={caption}
          onChange={(e) => { setCaption(e.target.value); setSaved("idle"); }}
          onBlur={() => persist({ caption })}
          placeholder="這張圖片的說明…"
          className="mt-1 w-full px-3 py-2 rounded-soft border border-sand bg-white focus:outline-none focus:border-terracotta text-sm"
        />
      </label>
    </div>
  );
}
