"use client";
/**
 * Modal for creating a new category from the picker / filter-bar. The
 * "+ 新分類" buttons were dead before this — they now open this modal,
 * which posts to `createCategoryAction` and (on success) calls back
 * with the new category so the parent can select / navigate to it.
 *
 * Self-contained: opens itself, manages its own form state, no
 * external library. Closes on success or Escape.
 */
import { useState, useTransition, useEffect, useRef } from "react";
import { createCategoryAction } from "../actions";
import type { Category, CategoryColor } from "../types";
import { COLOR_CLASSES } from "../types";

const COLORS: CategoryColor[] = [
  "terracotta", "sage", "sand", "cream",
  "lavender", "sky", "rose",
];

const EMOJI_SUGGESTIONS = [
  "🏷", "🎉", "🍜", "✈️", "📚", "🎬", "🎵", "⚽",
  "🌱", "💼", "🏠", "🎂", "📷", "💡", "🧘", "🎨",
];

export function CreateCategoryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Fires after the action returns successfully. Parent can use the
   *  new id/slug to auto-select / navigate. */
  onCreated?: (cat: Category) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷");
  const [color, setColor] = useState<CategoryColor>("terracotta");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset + autofocus when (re)opening.
  useEffect(() => {
    if (open) {
      setName(""); setEmoji("🏷"); setColor("terracotta"); setError(null);
      // Defer focus until the input is in the DOM and styles are applied.
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open]);

  // Escape-to-close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await createCategoryAction({ name, emoji, color });
      if (r.error) {
        setError(r.error);
      } else if (r.created) {
        onCreated?.(r.created);
        onClose();
      }
    });
  };

  const c = COLOR_CLASSES[color];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-soft shadow-soft border border-sand/60 w-full max-w-md p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="serif text-xl text-ink">新增分類</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-xl leading-none"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        {/* Live preview */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${c.bg} text-white shadow-card`}>
            <span className="leading-none">{emoji}</span>
            <span>{name.trim() || "預覽"}</span>
          </span>
        </div>

        <label className="block mb-3">
          <span className="text-sm font-medium text-ink/80">分類名稱</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="例如：美食、旅遊、家族傳統"
            className="mt-1.5 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) submit(); }}
          />
        </label>

        <div className="mb-3">
          <span className="text-sm font-medium text-ink/80 block mb-1.5">Emoji 圖示</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-soft border text-lg transition ${
                  emoji === e
                    ? "bg-ink/5 border-ink/30"
                    : "bg-white border-sand hover:bg-cream/40"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            placeholder="或自己貼一個 emoji"
            className="w-32 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-center text-lg"
          />
        </div>

        <div className="mb-4">
          <span className="text-sm font-medium text-ink/80 block mb-1.5">顏色</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((col) => {
              const cc = COLOR_CLASSES[col];
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-9 h-9 rounded-full ${cc.bg} transition ${
                    color === col ? "ring-2 ring-offset-2 ring-ink/40 scale-110" : "hover:scale-105"
                  }`}
                  aria-label={`color ${col}`}
                  title={col}
                />
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2 mb-3">
            ⚠ {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-sand">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 text-sm"
          >
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !name.trim() || !emoji.trim()}
            className="ml-auto px-5 py-2 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
          >
            {pending ? "建立中…" : "建立分類"}
          </button>
        </div>
      </div>
    </div>
  );
}
