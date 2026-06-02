"use client";
/**
 * Modal for editing a category's name / icon / color / description.
 *
 * Mirrors CreateCategoryModal's visual but pre-fills from `category` and
 * calls `updateCategoryAction` on save. Slug stays read-only (renaming it
 * would break every existing URL like `/app/feed?cat=food`).
 *
 * The server action re-checks every authorization rule, so this modal can
 * be opened from any caller that has decided the current user may edit
 * THIS category (admin, editor, or the creator of a custom one).
 */
import { useState, useTransition, useEffect, useRef } from "react";
import { updateCategoryAction } from "../actions";
import { uploadImageAction } from "@/modules/uploads/actions";
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

export function EditCategoryModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category;
  onClose: () => void;
  onSaved?: (cat: Category) => void;
}) {
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji || "🏷");
  const [iconImage, setIconImage] = useState<string | null>(category.iconImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [color, setColor] = useState<CategoryColor>(category.color);
  const [description, setDescription] = useState(category.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset to the row's values whenever we re-open the modal (so a previous
  // mid-edit attempt doesn't leak into the next time it's opened).
  useEffect(() => {
    if (open) {
      setName(category.name);
      setEmoji(category.emoji || "🏷");
      setIconImage(category.iconImage ?? null);
      setColor(category.color);
      setDescription(category.description ?? "");
      setError(null);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onIconFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const r = await uploadImageAction(fd);
    setUploading(false);
    if (r.ok) setIconImage(r.thumbUrl ?? r.url);
    else setError(r.error);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await updateCategoryAction({
          id: category.id,
          name,
          emoji,
          iconImage,
          color,
          description: description || null,
        });
        if (r.error) {
          setError(r.error);
        } else if (r.updated) {
          onSaved?.(r.updated);
          onClose();
        }
      } catch {
        // requirePermission throws on a denied gate (e.g. plain Member
        // editing someone else's category). Friendly fallback instead of
        // a console-only crash.
        setError("沒有權限編輯這個分類");
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
          <div>
            <h2 className="serif text-xl text-ink">編輯分類</h2>
            <p className="text-xs text-ink/45 mt-0.5">
              網址 <code className="font-mono text-ink/60">/{category.slug}</code> 不能改
              {category.isDefault && <span className="ml-2 text-sage-dark">· 系統預設</span>}
            </p>
          </div>
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
            {iconImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconImage} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="leading-none">{emoji}</span>
            )}
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
            className="mt-1.5 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) submit(); }}
          />
        </label>

        <div className="mb-3">
          <span className="text-sm font-medium text-ink/80 block mb-1.5">圖示</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {EMOJI_SUGGESTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmoji(e); setIconImage(null); }}
                className={`w-9 h-9 rounded-soft border text-lg transition ${
                  emoji === e && !iconImage
                    ? "bg-ink/5 border-ink/30"
                    : "bg-white border-sand hover:bg-cream/40"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={emoji}
              onChange={(e) => { setEmoji(e.target.value); setIconImage(null); }}
              maxLength={4}
              placeholder="或貼 emoji"
              className="w-28 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-center text-lg"
            />
            <span className="text-xs text-ink/40">或</span>
            {iconImage ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-sage-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconImage} alt="" className="w-7 h-7 rounded-full object-cover border border-sand" />
                <button type="button" onClick={() => setIconImage(null)} className="text-terracotta-dark hover:underline">
                  移除圖片
                </button>
              </span>
            ) : (
              <label className={`text-xs ${uploading ? "opacity-50" : "cursor-pointer"} px-3 py-2 rounded-soft border border-sand bg-white hover:bg-cream/40 text-ink/70`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(e) => { onIconFile(e.target.files?.[0]); e.target.value = ""; }}
                  className="hidden"
                />
                {uploading ? "上傳中…" : "🖼 上傳圖片"}
              </label>
            )}
          </div>
        </div>

        <div className="mb-3">
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

        <label className="block mb-4">
          <span className="text-sm font-medium text-ink/80">描述（可選）</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="一句話介紹這個分類…"
            className="mt-1.5 w-full px-3 py-2 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta text-sm"
          />
        </label>

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
            disabled={pending || !name.trim() || (!emoji.trim() && !iconImage)}
            className="ml-auto px-5 py-2 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
          >
            {pending ? "儲存中…" : "儲存變更"}
          </button>
        </div>
      </div>
    </div>
  );
}
