"use client";
/**
 * Page-level edit-mode toggle + the editable category list.
 *
 * Why it's one client component (not just a toggle button): React state
 * has to live above both the toggle and the rows that read it, so we own
 * both here. The server page passes the already-fetched data + per-user
 * permission flags down; we just decide what to render when editing.
 *
 * Edit mode hides the row-level ✎ / 🗑 by default — clicking the toggle
 * (paired visually with "+ 新分類") reveals them. Mirrors the photo wall.
 */
import { useState } from "react";
import Link from "next/link";
import type { Category } from "../types";
import { CategoryIcon } from "./CategoryChip";
import { CategoryEditButton } from "./CategoryEditButton";
import { CategoryDeleteButton } from "./CategoryDeleteButton";
import { CreateCategoryButton } from "./CreateCategoryButton";

type Row = {
  cat: Category;
  /** Has the server decided this user can edit / delete THIS row? */
  canEdit: boolean;
  canDelete: boolean;
};

export function CategoryManager({
  custom,
  defaults,
  canCreate,
  isAdmin,
  createBasePath = "/app/categories",
}: {
  custom: Row[];
  defaults: Row[];
  canCreate: boolean;
  isAdmin: boolean;
  createBasePath?: string;
}) {
  const [editMode, setEditMode] = useState(false);

  // Are there any rows the current user could actually edit / delete? If
  // not, hiding the toggle keeps the UI clean (no dead button).
  const anyEditable = [...custom, ...defaults].some((r) => r.canEdit || r.canDelete);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {anyEditable && (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition ${
              editMode
                ? "bg-terracotta text-white border-transparent shadow-card"
                : "bg-white text-ink/60 border-dashed border-sand hover:text-terracotta"
            }`}
            title={editMode ? "離開編輯模式" : "進入編輯模式"}
          >
            {editMode ? "✓ 完成編輯" : "✎ 編輯分類"}
          </button>
        )}
        {canCreate && <CreateCategoryButton basePath={createBasePath} />}
      </div>

      <section className="mb-8">
        <h2 className="serif text-lg text-ink mb-2">自訂分類</h2>
        {custom.length === 0 ? (
          <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-8 text-center">
            <div className="text-3xl mb-2">🏷</div>
            <p className="text-sm text-ink/55">還沒有自訂分類{canCreate ? "，用上方「+ 新分類」建立一個吧。" : "。"}</p>
          </div>
        ) : (
          <div className="bg-white rounded-soft border border-sand/60 divide-y divide-sand">
            {custom.map((r) => (
              <CategoryRow key={r.cat.id} row={r} editMode={editMode} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <h2 className="serif text-lg text-ink">系統預設分類</h2>
          <span className="text-xs text-ink/50">
            {isAdmin
              ? "只有管理員可以編輯 / 刪除預設分類。"
              : "這些是系統內建的分類，只有管理員能修改。"}
          </span>
        </div>
        <div className="bg-white rounded-soft border border-sand/60 divide-y divide-sand">
          {defaults.map((r) => (
            <CategoryRow key={r.cat.id} row={r} editMode={editMode} isSystem />
          ))}
        </div>
      </section>
    </>
  );
}

function CategoryRow({
  row,
  editMode,
  isSystem = false,
}: {
  row: Row;
  editMode: boolean;
  isSystem?: boolean;
}) {
  const { cat, canEdit, canDelete } = row;
  return (
    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
      <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
        <CategoryIcon category={cat} px={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink flex items-center gap-1.5">
          {cat.name}
          {isSystem && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sage-soft/40 text-sage-dark font-medium">
              系統
            </span>
          )}
        </div>
        {cat.description && <div className="text-xs text-ink/50 truncate">{cat.description}</div>}
      </div>
      <Link
        href={`/app/feed?cat=${cat.slug}`}
        className="text-xs text-terracotta hover:underline shrink-0"
      >
        看內容 →
      </Link>
      {/* Row-level actions only appear once the page-level toggle is on. */}
      {editMode && canEdit && <CategoryEditButton category={cat} />}
      {editMode && canDelete && <CategoryDeleteButton id={cat.id} name={cat.name} />}
    </div>
  );
}
