import { requireCurrentUser } from "@/modules/auth";
import { listMyFeedbackDb, FEEDBACK_KINDS } from "@/modules/feedback";
import { FeedbackForm } from "./FeedbackForm";

/**
 * /app/feedback — anyone signed in can send a message to the admins
 * (bug / idea / question / other) and see their own past submissions.
 * Reading EVERYONE's feedback is an admin-only view at /app/admin/feedback.
 */
export default async function FeedbackPage() {
  const me = await requireCurrentUser();
  const mine = await listMyFeedbackDb(me.id);

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">FEEDBACK</p>
        <h1 className="serif text-3xl text-ink">意見回饋 / 聯絡管理員</h1>
        <p className="text-ink/60 text-sm mt-1 leading-relaxed">
          有問題、建議，或想跟管理員說的話都可以寫在這裡。管理員會看到你的訊息。
        </p>
      </div>

      <FeedbackForm />

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="serif text-lg text-ink mb-3">我送出的回饋</h2>
          <div className="space-y-3">
            {mine.map((f) => {
              const meta = FEEDBACK_KINDS[f.kind];
              return (
                <div key={f.id} className="bg-white rounded-soft border border-sand/60 p-4">
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-cream text-ink/70">{meta.emoji} {meta.label}</span>
                    {f.status === "RESOLVED" ? (
                      <span className="px-2 py-0.5 rounded-full bg-sage-soft text-sage-dark">✓ 已處理</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">處理中</span>
                    )}
                    <span className="ml-auto text-ink/40">{new Date(f.createdAt).toLocaleDateString("zh-TW")}</span>
                  </div>
                  {f.subject && <div className="text-sm font-medium text-ink">{f.subject}</div>}
                  <p className="text-sm text-ink/75 whitespace-pre-wrap">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
