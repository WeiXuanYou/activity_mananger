import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findCustomPageBySlugDb, BlockList } from "@/modules/custom-pages";
import { Avatar, findMemberDb } from "@/modules/core/members";
import { CategoryChipList } from "@/modules/core/categories";
import { PageOwnerControls } from "./PageOwnerControls";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function AppCustomPageDetail({ params, searchParams }: Params) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const me = await requireCurrentUser();

  const page = await findCustomPageBySlugDb(slug);
  if (!page) notFound();

  const owner = await findMemberDb(page.ownerId);
  const canEditAnyone = await canCurrentUser("page.publish");
  const isOwner = page.ownerId === me.id;
  // Edit blocks: owner, page admins (page.publish), or anyone when the
  // owner opened the page for collaboration.
  const canEdit = isOwner || canEditAnyone || Boolean(page.allowCollab);
  // Manage (delete / toggle collab): owner or page admin only.
  const canManage = isOwner || canEditAnyone;
  // Edit mode is opt-in via ?edit=1 so the read view stays clean by default
  const editMode = canEdit && edit === "1";

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/pages" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回頁面列表
      </Link>

      <div className="h-48 rounded-soft mb-6 relative overflow-hidden" style={{ background: page.cover }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6 text-white">
          <p className="text-xs tracking-widest font-medium opacity-80 mb-1">CUSTOM PAGE</p>
          <h1 className="serif text-3xl md:text-4xl">{page.title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        {owner && (
          <Link href={`/app/members/${owner.id}`} className="flex items-center gap-2 text-sm hover:opacity-80 transition">
            <Avatar member={owner} size={28} />
            <span className="text-ink/70">由 <span className="font-medium text-ink hover:text-terracotta">{owner.name}</span> 維護</span>
          </Link>
        )}
        {page.categories && page.categories.length > 0 && (
          <CategoryChipList categories={page.categories} size="xs" />
        )}
        <span className="ml-auto text-xs text-ink/40">/{page.slug}</span>
        {canEdit && (
          editMode ? (
            <Link
              href={`/app/pages/${page.slug}`}
              className="text-xs px-3 py-1.5 rounded-soft bg-sage-dark text-cream hover:opacity-90 transition"
            >
              ✓ 完成編輯
            </Link>
          ) : (
            <Link
              href={`/app/pages/${page.slug}?edit=1`}
              className="text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 transition"
            >
              ✎ 編輯頁面
            </Link>
          )
        )}
      </div>

      {editMode && (
        <div className="mb-4 rounded-soft border border-sage/30 bg-sage-soft/30 px-4 py-3 text-xs text-sage-dark space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">✎</span>
            編輯模式：滑鼠移到 block 上會出現工具列（上移 / 下移 / 刪除）；點 block 之間的「+」加入新 block；文字 / 圖片 block 下方可直接編輯內容。
          </div>
          {(canManage || page.allowCollab) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <PageOwnerControls
                pageId={page.id}
                allowCollab={Boolean(page.allowCollab)}
                canToggleCollab={canManage}
                canDelete={canManage}
              />
              {!canManage && page.allowCollab && (
                <span className="text-[11px] text-ink/55">🤝 這是開放協作的頁面，你的編輯會直接套用。</span>
              )}
            </div>
          )}
        </div>
      )}

      <BlockList
        blocks={page.resolvedBlocks ?? []}
        edit={editMode}
        pageId={page.id}
      />

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        這個頁面的每個 block 都透過{" "}
        <code className="text-terracotta">getBlockRenderer(type)</code> 從 registry
        取得渲染器渲染——目前已實作 RichText / Markdown / HTML / Image / EmbedPoll 五種。
      </div>
    </main>
  );
}
