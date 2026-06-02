"use client";
/**
 * Trigger button for the EditCategoryModal. Rendered ONLY when the caller
 * has decided the current user is allowed to edit this category (admin,
 * editor, or the creator of a custom one). The server action re-checks.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditCategoryModal } from "./EditCategoryModal";
import type { Category } from "../types";

export function CategoryEditButton({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40"
        title="編輯分類"
      >
        ✎ 編輯
      </button>
      <EditCategoryModal
        open={open}
        category={category}
        onClose={() => setOpen(false)}
        onSaved={() => {
          // Refresh server-rendered chips / filter bars so the new name
          // / icon / color is reflected immediately.
          router.refresh();
        }}
      />
    </>
  );
}
