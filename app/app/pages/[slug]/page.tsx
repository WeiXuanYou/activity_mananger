import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { findCustomPageBySlugDb, BlockList } from "@/modules/custom-pages";
import { Avatar, findMemberDb } from "@/modules/core/members";
import { CategoryChipList } from "@/modules/core/categories";

type Params = { params: Promise<{ slug: string }> };

export default async function AppCustomPageDetail({ params }: Params) {
  const { slug } = await params;
  await requireCurrentUser();

  const page = await findCustomPageBySlugDb(slug);
  if (!page) notFound();

  const owner = await findMemberDb(page.ownerId);

  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
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
          <div className="flex items-center gap-2 text-sm">
            <Avatar member={owner} size={28} />
            <span className="text-ink/70">由 <span className="font-medium text-ink">{owner.name}</span> 維護</span>
          </div>
        )}
        {page.categories && page.categories.length > 0 && (
          <CategoryChipList categories={page.categories} size="xs" />
        )}
        <span className="ml-auto text-xs text-ink/40">/{page.slug}</span>
      </div>

      <BlockList blocks={page.resolvedBlocks ?? []} />

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        這個頁面的每個 block 都透過{" "}
        <code className="text-terracotta">getBlockRenderer(type)</code> 從 registry
        取得渲染器渲染——目前已實作 RichText / Markdown / HTML / Image / EmbedPoll 五種。
      </div>
    </main>
  );
}
