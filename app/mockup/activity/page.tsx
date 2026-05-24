import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { PollCard } from "../_components/Cards";
import { Avatar, AvatarStack } from "../_components/Avatar";
import { activities, polls, sampleComments, findMember, members } from "../_data";

export default function ActivityDetailMockup() {
  const a = activities[0];
  const host = findMember(a.hostId);
  const poll = polls[0];
  const goingIds = ["u1", "u2", "u3", "u4"];

  return (
    <main>
      <MockNav />
      <div className="max-w-5xl mx-auto px-5 py-6">
        <Link href="/mockup/feed" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
          ← 回動態
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-soft shadow-card overflow-hidden border border-sand/60 mb-6">
          <div className="h-48 md:h-64 relative" style={{ background: a.cover }}>
            <span className="absolute top-4 left-4 bg-white/90 text-terracotta text-xs font-medium px-2.5 py-1 rounded-full">
              即將舉行
            </span>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="serif text-3xl text-ink mb-2">{a.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink/60">
                  <span>🗓️ {a.startsAt}</span>
                  <span>📍 {a.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <Avatar member={host} size={28} />
              <span className="text-sm text-ink/70">由 <span className="font-medium text-ink">{host.name}</span> 發起</span>
            </div>

            <p className="text-ink/80 leading-relaxed mb-6">{a.description}</p>

            {/* RSVP buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition">
                ✓ 我會去 ({a.rsvp.going})
              </button>
              <button className="px-5 py-2.5 rounded-soft bg-white border border-sand text-ink hover:bg-cream/50 transition">
                也許 ({a.rsvp.maybe})
              </button>
              <button className="px-5 py-2.5 rounded-soft bg-white border border-sand text-ink/60 hover:bg-cream/50 transition">
                無法參加 ({a.rsvp.declined})
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-sand">
              <AvatarStack memberIds={goingIds} members={members} />
              <span className="text-sm text-ink/60">和其他 {a.rsvp.going - goingIds.length} 人</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Embedded poll */}
            <div>
              <h2 className="serif text-xl text-ink mb-3">📊 活動內投票</h2>
              <PollCard poll={poll} />
            </div>

            {/* Comments */}
            <div>
              <h2 className="serif text-xl text-ink mb-3">💬 留言 ({sampleComments.length})</h2>
              <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 space-y-5">
                {sampleComments.map((c) => {
                  const author = findMember(c.authorId);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <Avatar member={author} size={36} />
                      <div className="flex-1">
                        <div className="bg-cream/50 rounded-soft px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-ink">{author.name}</span>
                            <span className="text-xs text-ink/40">{c.createdAt}</span>
                          </div>
                          <p className="text-ink/80 text-sm leading-relaxed">{c.body}</p>
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-ink/50">
                          <button className="hover:text-terracotta">讚</button>
                          <button className="hover:text-terracotta">回覆</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-sand flex gap-3">
                  <Avatar member={findMember("u2")} size={36} />
                  <div className="flex-1">
                    <textarea
                      placeholder="寫一則留言..."
                      className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
              <h3 className="serif text-base text-ink mb-3">活動清單</h3>
              <ul className="space-y-2 text-sm text-ink/70">
                <li className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-terracotta" />
                  <span>烤肉架 × 2</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-terracotta" />
                  <span>木炭 5kg</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-terracotta" />
                  <span>飲料（雅婷負責）</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-terracotta" />
                  <span>柚子湯（阿嬤）</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
              <h3 className="serif text-base text-ink mb-3">相關活動</h3>
              <div className="space-y-3 text-sm">
                {activities.slice(1).map((other) => (
                  <Link key={other.id} href="/mockup/activity" className="block hover:text-terracotta">
                    <div className="text-xs text-ink/50">{other.startsAt.slice(0, 10)}</div>
                    <div className="text-ink">{other.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
