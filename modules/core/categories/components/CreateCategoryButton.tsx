"use client";
/**
 * The "+ 新分類" pill that lived in the server-rendered
 * CategoryFilterBar (and didn't do anything). Now a real client button
 * that opens the create modal and navigates to the new category's
 * filter URL after success.
 *
 * Rendered conditionally by the parent based on the current user's
 * `category.create` permission.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function CreateCategoryButton({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 ml-1 px-3 py-1.5 rounded-full text-sm text-ink/50 hover:text-terracotta border border-dashed border-sand"
      >
        ＋ 新分類
      </button>
      <CreateCategoryModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(cat) => {
          // Navigate to the new category's filter URL so the user sees
          // their freshly-created tag in action.
          router.push(`${basePath}?cat=${cat.slug}`);
          router.refresh();
        }}
      />
    </>
  );
}
