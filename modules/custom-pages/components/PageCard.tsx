import Link from "next/link";
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import type { CustomPage } from "../types";

export function PageCard({ page }: { page: CustomPage }) {
  const owner = findMember(page.ownerId);
  const cats = findCategoriesByIds(page.categoryIds);
  return (
    <Link
      href="/mockup/page-detail"
      className="group bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden hover:shadow-soft hover:-translate-y-1 transition"
    >
      <div className="h-36 relative" style={{ background: page.cover }}>
        <span className="absolute top-3 right-3 bg-white/90 text-ink/70 text-xs px-2 py-1 rounded-full">
          {page.blocks} 個區塊
        </span>
      </div>
      <div className="p-5">
        <h3 className="serif text-xl text-ink mb-2 group-hover:text-terracotta transition">
          {page.title}
        </h3>
        <p className="text-sm text-ink/65 leading-relaxed line-clamp-2 mb-3">{page.excerpt}</p>
        {cats.length > 0 && (
          <div className="mb-3"><CategoryChipList categories={cats} size="xs" /></div>
        )}
        <div className="flex items-center gap-2 pt-3 border-t border-sand">
          <Avatar member={owner} size={24} />
          <span className="text-xs text-ink/60">{owner.name}</span>
          <span className="ml-auto text-xs text-ink/40">/{page.slug}</span>
        </div>
      </div>
    </Link>
  );
}
