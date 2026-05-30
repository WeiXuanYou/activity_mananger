"use client";
/**
 * Per-block editor toolbar. Sits in the corner of each block while
 * `editing` is on, exposing move-up / move-down / delete. The grey
 * "+ 加入 XX" rail underneath each block adds a new block after it.
 *
 * Server actions:
 *   - moveBlockAction(blockId, "up" | "down")
 *   - deleteBlockAction(blockId)
 *   - addStarterBlockAction(pageId, type)
 */
import { useTransition, useState } from "react";
import {
  moveBlockAction,
  deleteBlockAction,
  addStarterBlockAction,
} from "../actions";
import type { BlockType } from "../types";

const ADDABLE: { type: BlockType; label: string; emoji: string }[] = [
  { type: "markdown",   label: "Markdown",  emoji: "📝" },
  { type: "richtext",   label: "RichText",  emoji: "📄" },
  { type: "image",      label: "圖片",       emoji: "🖼" },
  { type: "embed-poll", label: "嵌入投票",   emoji: "📊" },
  { type: "html",       label: "HTML",      emoji: "</>" },
];

export function BlockToolbar({
  blockId,
  isFirst,
  isLast,
}: {
  blockId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const btn = "w-7 h-7 rounded text-ink/55 hover:bg-cream hover:text-ink transition flex items-center justify-center text-sm disabled:opacity-30";
  return (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 bg-white/95 backdrop-blur border border-sand rounded-soft shadow-card px-1 py-1 opacity-0 group-hover:opacity-100 transition">
      <button
        type="button"
        title="上移"
        disabled={isFirst || pending}
        onClick={() => startTransition(() => moveBlockAction(blockId, "up"))}
        className={btn}
      >
        ↑
      </button>
      <button
        type="button"
        title="下移"
        disabled={isLast || pending}
        onClick={() => startTransition(() => moveBlockAction(blockId, "down"))}
        className={btn}
      >
        ↓
      </button>
      <button
        type="button"
        title="刪除"
        disabled={pending}
        onClick={() => {
          if (confirm("刪除這個 block？")) {
            startTransition(() => deleteBlockAction(blockId));
          }
        }}
        className={`${btn} hover:text-terracotta`}
      >
        🗑
      </button>
    </div>
  );
}

/**
 * The slim "+" rail between blocks. Collapsed by default; click to expand
 * a row of block-type chips, then click one to insert.
 */
export function AddBlockRail({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const add = (type: BlockType) => {
    setOpen(false);
    startTransition(() => addStarterBlockAction(pageId, type));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="w-full my-1 py-1.5 text-xs text-ink/35 hover:text-terracotta hover:bg-cream/40 rounded transition flex items-center justify-center gap-1 group"
      >
        <span className="h-px flex-1 bg-sand opacity-40 group-hover:opacity-80 transition" />
        <span className="px-2">＋ 加入 block</span>
        <span className="h-px flex-1 bg-sand opacity-40 group-hover:opacity-80 transition" />
      </button>
    );
  }

  return (
    <div className="my-2 p-2 rounded-soft bg-cream/60 border border-sand flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-ink/55 mr-1">加入：</span>
      {ADDABLE.map((b) => (
        <button
          key={b.type}
          type="button"
          disabled={pending}
          onClick={() => add(b.type)}
          className="text-xs px-2.5 py-1 rounded-full bg-white border border-sand hover:bg-terracotta hover:text-white hover:border-terracotta transition disabled:opacity-50"
        >
          {b.emoji} {b.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="ml-auto text-xs text-ink/40 hover:text-ink"
      >
        取消
      </button>
    </div>
  );
}
