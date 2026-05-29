import Link from "next/link";

/**
 * Bell icon with unread badge for the app header. Server component —
 * the count is passed in from the layout (which already has the session).
 */
export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/app/notifications"
      className="relative px-2 py-1.5 rounded-soft text-ink/60 hover:bg-sand/60 transition"
      title="通知"
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-terracotta text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
