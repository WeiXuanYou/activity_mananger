import Link from "next/link";
import { MockNav } from "../_layout/MockNav";
import { Avatar, findMember } from "@/modules/core/members";
import { listActivities, ActivityCard } from "@/modules/core/activities";
import { listPosts, PostCard } from "@/modules/core/posts";
import { filterCustomPagesByOwner } from "@/modules/custom-pages";
import { RoleBadge } from "@/modules/permissions";

export default function ProfileMockup() {
  const me = findMember("u2");
  const myPosts = listPosts().filter((p) => p.authorId === me.id);
  const myActivities = listActivities().filter((a) => a.hostId === me.id);
  const myPages = filterCustomPagesByOwner(me.id);

  return (
    <main>
      <MockNav />
      <div className="max-w-5xl mx-auto px-5 py-8">
        <Link href="/mockup/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
          ← 回動態
        </Link>

        <div className="bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden mb-6">
          <div className="h-32" style={{ background: "linear-gradient(135deg, #E8B5A2 0%, #7A8E6E 100%)" }} />
          <div className="p-6 pt-0 -mt-10">
            <div className="flex items-end gap-4 mb-4">
              <div className="ring-4 ring-white rounded-full">
                <Avatar member={me} size={88} />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="serif text-2xl text-ink">{me.name}</h1>
                  <RoleBadge role={me.role} />
                </div>
                <p className="text-sm text-ink/60">@{me.handle} · 加入於 2024 春</p>
              </div>
              <button className="px-4 py-2 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40 self-end">
                編輯檔案
              </button>
            </div>
            <p className="text-ink/75 leading-relaxed mb-4">
              喜歡做菜、爬山、整理家族回憶。希望這個空間讓我們家人朋友之間更靠近。
            </p>
            <div className="flex gap-6 text-sm">
              <div><span className="font-semibold text-ink">{myPosts.length}</span> <span className="text-ink/60">文章</span></div>
              <div><span className="font-semibold text-ink">{myActivities.length}</span> <span className="text-ink/60">活動</span></div>
              <div><span className="font-semibold text-ink">{myPages.length}</span> <span className="text-ink/60">自訂頁面</span></div>
              <div><span className="font-semibold text-ink">87</span> <span className="text-ink/60">收到的讚</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-5 border-b border-sand">
          {["文章", "活動", "頁面", "投票紀錄"].map((t, i) => (
            <button
              key={t}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                i === 0 ? "border-terracotta text-terracotta" : "border-transparent text-ink/60 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="space-y-5">
          {myPosts.length > 0 ? (
            myPosts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <div className="bg-cream/40 rounded-soft border border-sand p-6 text-center text-ink/50">
              還沒有發布過文章。
            </div>
          )}

          {myActivities.length > 0 && (
            <>
              <h3 className="serif text-lg text-ink mt-8">主辦活動</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myActivities.map((a) => <ActivityCard key={a.id} activity={a} />)}
              </div>
            </>
          )}

          {myPages.length > 0 && (
            <>
              <h3 className="serif text-lg text-ink mt-8">自訂頁面</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPages.map((p) => (
                  <Link
                    key={p.id}
                    href="/mockup/page-detail"
                    className="bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden hover:shadow-soft transition"
                  >
                    <div className="h-20" style={{ background: p.cover }} />
                    <div className="p-4">
                      <h4 className="serif text-base text-ink">{p.title}</h4>
                      <p className="text-xs text-ink/60 mt-1 line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
