import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { listCategoriesDb } from "@/modules/core/categories";
import { NewPageForm } from "./NewPageForm";

export default async function NewCustomPagePage() {
  const me = await requireCurrentUser();
  const categories = await listCategoriesDb();

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/pages" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回頁面列表
      </Link>

      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">CUSTOM PAGES · NEW</p>
        <h1 className="serif text-3xl text-ink">建立自訂頁面</h1>
        <p className="text-ink/60 text-sm mt-1">
          以 <strong className="text-ink/80">{me.name}</strong> 建立 · 用 Markdown 寫第一個 block，之後可以再加其他類型。
        </p>
      </div>

      <NewPageForm categories={categories} />
    </main>
  );
}
