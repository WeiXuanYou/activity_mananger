import Link from "next/link";
import { Avatar, findMember } from "@/modules/core/members";
import { CategoryChipList, findCategoriesByIds } from "@/modules/core/categories";
import type { Activity } from "../types";

export function ActivityCard({ activity }: { activity: Activity }) {
  const host = findMember(activity.hostId);
  const cats = findCategoriesByIds(activity.categoryIds);
  return (
    <Link
      href="/mockup/activity"
      className="block bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 hover:shadow-soft transition group"
    >
      <div className="h-32 relative" style={{ background: activity.cover }}>
        <span className="absolute top-3 left-3 bg-white/90 text-terracotta text-xs font-medium px-2 py-1 rounded-full">
          活動
        </span>
        <span className="absolute bottom-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
          {activity.startsAt.slice(5, 10).replace("-", "/")}
        </span>
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
