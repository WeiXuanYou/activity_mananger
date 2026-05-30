"use client";
/**
 * Tiny dropdown for owner-only controls on a piece of content (a post,
 * activity, or poll). Edit links to a provided URL; Delete fires a
 * server action after confirm.
 *
 * Rendered ONLY when the caller decides the current user is the owner
 * or has moderation perm — this component does no auth check itself.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function OwnerActions({
  editHref,
  onDelete,
  redirectTo,
  label = "編輯/刪除",
}: {
  editHref: string;
  onDelete: () => Promise<void>;
  /** Where to send the user after a successful delete. Defaults to /app/feed. */
  redirectTo?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("確定要刪除？刪掉就找不回來了。")) return;
    setOpen(false);
    startTransition(async () => {
      await onDelete();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={label}
        aria-label={label}
        className="w-8 h-8 rounded-full text-ink/40 hover:text-ink hover:bg-cream/70 transition flex items-center justify-center text-lg leading-none"
      >
        ⋯
      </button>
      {open && (
        <>
          {/* click-away catcher */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-36 rounded-soft border border-sand bg-white shadow-soft py-1">
            <Link
              href={editHref}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink/80 hover:bg-cream/60"
            >
              ✎ 編輯
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="block w-full text-left px-3 py-2 text-sm text-terracotta-dark hover:bg-terracotta-soft/40 disabled:opacity-50"
            >
              {pending ? "刪除中..." : "🗑 刪除"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
