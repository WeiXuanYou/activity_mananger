/**
 * Activity card — used in feed, /activities listings, profile pages.
 *
 * Visual cues for time:
 *   - Upper-left chip:  "活動" (future) or "已結束" (past)
 *   - Upper-right chip: short date "09/25 (五)" or "今天"/"明天"
 *   - Lower-right chip: countdown "還有 3 天" (future only)
 *   - Whole card dimmed (opacity-75) for past activities
 *
 * Categories appear as a row of small chips between title and host strip.
 */
import Link from "next/link";
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import { formatShortDate, relativeFromNow, daysFromNow } from "@/lib/date";
import type { Activity } from "../types";

export function ActivityCard({ activity }: { activity: Activity }) {
  const host = activity.host ?? findMember(activity.hostId);
  const cats = activity.categories ?? findCategoriesByIds(activity.categoryIds);
  // Derived once; used in three places (border opacity / chip label / chip visibility)
  const isPast = daysFromNow(activity.startsAt) < 0;
  const rel = relativeFromNow(activity.startsAt);
  const short = formatShortDate(activity.startsAt);

  return (
    <Link
      href="/mockup/activity"
      className={`block bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 hover:shadow-soft transition group ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <div className="h-32 relative" style={{ background: activity.cover }}>
        <span className="absolute top-3 left-3 bg-white/90 text-terracotta text-xs font-medium px-2 py-1 rounded-full">
          {isPast ? "已結束" : "活動"}
        </span>
        <span className="absolute top-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
          {short}
        </span>
        {!isPast && (
          <span className="absolute bottom-3 right-3 bg-terracotta text-white text-[10px] font-medium px-2 py-1 rounded-full shadow-card">
            {rel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="serif text-lg text-ink mb-1 group-hover:text-terracotta transition">
          {activity.title}
        </h3>
        <p className="text-ink/60 text-sm mb-2">📍 {activity.location}</p>
        <div className="mb-3"><CategoryChipList categories={cats} size="xs" /></div>
        <div className="flex items-center justify-between pt-3 border-t border-sand">
          <div className="flex items-center gap-2 text-xs text-ink/60">
            <Avatar member={host} size={20} />
            <span>{host.name} 發起</span>
          </div>
          <div className="text-xs text-sage-dark font-medium">
            {activity.rsvp.going} 人參加
          </div>
        </div>
      </div>
    </Link>
  );
}
