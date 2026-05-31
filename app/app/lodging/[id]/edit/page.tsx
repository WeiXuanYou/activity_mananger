import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { findLodgingDb } from "@/modules/core/lodging";
import { LodgingForm } from "../../LodgingForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditLodgingPage({ params }: Params) {
  const { id } = await params;
  const me = await requireCurrentUser();
  const lodging = await findLodgingDb(id);
  if (!lodging) notFound();

  const isAdmin = await canCurrentUser("admin.approve");
  const isOwner = lodging.addedById === me.id;
  // Author + admin always; collaborators when the owner opted in.
  if (!isOwner && !isAdmin && !lodging.allowCollab) redirect("/app/lodging?denied=edit");
  const canToggleCollab = isOwner || isAdmin;

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/lodging" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回住宿列表
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">LODGING · EDIT</p>
        <h1 className="serif text-3xl text-ink">編輯住宿</h1>
        {!isOwner && lodging.allowCollab && (
          <p className="text-xs text-sage-dark bg-sage-soft/30 border border-sage/30 rounded-soft px-3 py-2 mt-2">
            🤝 這筆開放協作編輯——你的修改會直接套用。移除仍由原建立者或管理員處理。
          </p>
        )}
      </div>
      <LodgingForm existing={lodging} canToggleCollab={canToggleCollab} />
    </main>
  );
}
