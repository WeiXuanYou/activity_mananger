import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { listNotificationsDb } from "@/modules/notifications";
import { MarkAllReadButton } from "./MarkAllReadButton";

const KIND_EMOJI: Record<string, string> = {
  "permission.approved": "🎉",
  "permission.rejected": "🔕",
  "activity.rsvp": "📅",
  "post.pinned": "📌",
  "feedback.received": "📨",
  mention: "💬",
  welcome: "👋",
};

export default async function NotificationsPage() {
  const me = await requireCurrentUser();
  const notifications = await listNotificationsDb(me.id);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-end gap-3 mb-6">
        <div>
          <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">NOTIFICATIONS</p>
          <h1 className="serif text-3xl text-ink">通知</h1>
        </div>
        {hasUnread && <div className="ml-auto"><MarkAllReadButton /></div>}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-12 text-center">
          <div className="text-4xl mb-2">🔔</div>
          <p className="serif text-lg text-ink/70">還沒有通知</p>
          <p className="text-sm text-ink/50 mt-1">有人參加你的活動、或權限申請有結果時會出現在這裡</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-soft border p-4 transition ${
                  n.read
                    ? "bg-white border-sand/60"
                    : "bg-terracotta-soft/20 border-terracotta/30"
                }`}
              >
                <div className="text-2xl shrink-0">{KIND_EMOJI[n.kind] ?? "🔔"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-terracotta shrink-0" />}
                  </div>
                  <p className="text-sm text-ink/70 mt-0.5 leading-relaxed">{n.body}</p>
                  <span className="text-xs text-ink/40 mt-1 block">{n.createdAt}</span>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:opacity-90">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-cream/40 rounded-soft border border-sand p-4 text-xs text-ink/60 leading-relaxed">
        <strong className="text-ink/80">提示：</strong>
        通知由 <code className="text-terracotta">modules/notifications/notify()</code> 產生——
        和 <code className="text-terracotta">analytics.emit()</code> 一樣是單一進入點。
        目前接了：權限核准/拒絕、有人 RSVP 你的活動。公用導向，無私訊。
      </div>
    </main>
  );
}
