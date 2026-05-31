import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";
import { Avatar } from "@/modules/core/members";
import { listFeedbackDb, FEEDBACK_KINDS } from "@/modules/feedback";
import { FeedbackControls } from "./FeedbackControls";

/**
 * /app/admin/feedback — admin inbox for member feedback. Admin-only.
 */
export default async function AdminFeedbackPage() {
  await requireCurrentUser();
  const isAdmin = await canCurrentUser("admin.approve");
  if (!isAdmin) redirect("/app/feed?denied=admin");

  const items = await listFeedbackDb();
  const open = items.filter((f) => f.status === "OPEN");
  const resolved = items.filter((f) => f.status === "RESOLVED");

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/app/admin" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
        ← 回管理工具
      </Link>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-ink text-white px-2 py-0.5 rounded-full">ADMIN</span>
        <p className="text-sage-dark text-xs font-medium tracking-widest">FEEDBACK INBOX</p>
      </div>
      <h1 className="serif text-3xl text-ink mb-2">意見回饋</h1>
      <p className="text-sm text-ink/60 mb-6">
        成員透過 <Link href="/app/feedback" className="text-terracotta hover:underline">/app/feedback</Link> 送出的訊息。
        共 {items.length} 則 · {open.length} 則待處理。
      </p>

      {items.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-10 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="serif text-lg text-ink/70">還沒有任何回饋</p>
        </div>
      ) : (
        <div className="space-y-6">
          <FeedbackSection title="待處理" items={open} emptyText="沒有待處理的回饋 🎉" />
          {resolved.length > 0 && <FeedbackSection title="已處理" items={resolved} emptyText="" muted />}
        </div>
      )}
    </main>
  );
}

function FeedbackSection({
  title,
  items,
  emptyText,
  muted = false,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listFeedbackDb>>;
  emptyText: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="serif text-lg text-ink mb-3">{title}（{items.length}）</h2>
      {items.length === 0 ? (
        emptyText ? <p className="text-sm text-ink/50">{emptyText}</p> : null
      ) : (
        <div className="space-y-3">
          {items.map((f) => {
            const meta = FEEDBACK_KINDS[f.kind];
            return (
              <div
                key={f.id}
                className={`bg-white rounded-soft border border-sand/60 p-4 ${muted ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-cream text-ink/70 text-xs">{meta.emoji} {meta.label}</span>
                  {f.author ? (
                    <span className="flex items-center gap-1.5 text-xs text-ink/60">
                      <Avatar member={f.author} size={20} />
                      {f.author.name}
                    </span>
                  ) : (
                    <span className="text-xs text-ink/40">（帳號已刪除）</span>
                  )}
                  <span className="ml-auto text-xs text-ink/40">
                    {new Date(f.createdAt).toLocaleString("zh-TW", { hour12: false })}
                  </span>
                </div>
                {f.subject && <div className="text-sm font-medium text-ink mb-1">{f.subject}</div>}
                <p className="text-sm text-ink/80 whitespace-pre-wrap mb-2">{f.body}</p>
                {f.contact && (
                  <p className="text-xs text-ink/55 mb-2">📞 聯絡方式：{f.contact}</p>
                )}
                <div className="pt-2 border-t border-sand/70 flex items-center justify-between gap-2">
                  {f.status === "RESOLVED" && f.resolvedAt ? (
                    <span className="text-xs text-sage-dark">✓ 已於 {new Date(f.resolvedAt).toLocaleDateString("zh-TW")} 處理</span>
                  ) : (
                    <span className="text-xs text-amber-700">處理中</span>
                  )}
                  <FeedbackControls id={f.id} resolved={f.status === "RESOLVED"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
