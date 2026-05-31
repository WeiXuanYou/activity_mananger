"use client";
import { useRef, useState, useTransition } from "react";
import type { Member } from "@/modules/core/members";
import { Avatar } from "@/modules/core/members";
import { createCommentAction } from "@/modules/comments/actions";
import { uploadImageAction } from "@/modules/uploads/actions";
import type { CommentParentType } from "../types";

export function CommentForm({
  me,
  parentType,
  parentId,
}: {
  me: Member;
  parentType: CommentParentType;
  parentId: string;
}) {
  const [body, setBody] = useState("");
  const [image, setImage] = useState<{ url: string; thumbUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = Boolean(body.trim() || image);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const r = await uploadImageAction(fd);
    setUploading(false);
    if (r.ok) setImage({ url: r.url, thumbUrl: r.thumbUrl });
    else setError(r.error);
  };

  const submit = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await createCommentAction({ parentType, parentId, body, image: image?.url ?? null });
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
        setImage(null);
        textareaRef.current?.blur();
      }
    });
  };

  return (
    <div className="pt-4 border-t border-sand">
      <div className="flex gap-3">
        <Avatar member={me} size={36} />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="寫一則留言...（用 @帳號 標記某人）"
            rows={2}
            className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta text-sm resize-none"
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter to submit
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
          />
          {image && (
            <div className="mt-2 relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.thumbUrl ?? image.url} alt="" className="max-h-32 rounded-soft border border-sand" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-sand text-xs text-terracotta shadow-card hover:bg-terracotta hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
          {error && (
            <p className="mt-1 text-xs text-terracotta-dark">⚠ {error}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={submit}
              disabled={pending || !canSubmit}
              className="px-4 py-1.5 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
            >
              {pending ? "送出中..." : "留言"}
            </button>
            <label className={`text-sm ${uploading ? "opacity-50" : "cursor-pointer"} text-ink/55 hover:text-terracotta`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }}
                className="hidden"
              />
              {uploading ? "上傳中…" : "🖼 圖片"}
            </label>
            <span className="text-xs text-ink/40 ml-auto">⌘/Ctrl + Enter 送出</span>
          </div>
        </div>
      </div>
    </div>
  );
}
