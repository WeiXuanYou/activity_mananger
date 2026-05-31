import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { NewLodgingForm } from "./NewLodgingForm";

type Search = { searchParams: Promise<{ region?: string; activity?: string }> };

export default async function NewLodgingPage({ searchParams }: Search) {
  await requireCurrentUser();
  const sp = await searchParams;
  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/lodging" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回住宿列表
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">LODGING · NEW</p>
        <h1 className="serif text-3xl text-ink">新增住宿</h1>
        <p className="text-ink/60 text-sm mt-1">
          無論是「下次想去」的推薦、還是「上次住過」的紀錄都可以記下來。
        </p>
      </div>
      <NewLodgingForm
        defaultRegion={sp.region ?? ""}
        defaultActivityId={sp.activity ?? ""}
      />
    </main>
  );
}
