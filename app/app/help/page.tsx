import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { canCurrentUser } from "@/modules/permissions";

/**
 * /app/help — a friendly how-to for new family/friends users.
 *
 * Lives inside (app)/layout.tsx so it respects auth; people who land here
 * already have a session. Content is plain HTML/Tailwind — no DB queries.
 */
export default async function HelpPage() {
  const me = await requireCurrentUser();
  const [isAdmin, canInvite] = await Promise.all([
    canCurrentUser("admin.approve"),
    canCurrentUser("invite.create"),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-5 py-6 sm:py-10">
      <div className="mb-8">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">GETTING STARTED</p>
        <h1 className="serif text-3xl text-ink">怎麼使用「相聚」</h1>
        <p className="text-ink/65 text-sm mt-2 leading-relaxed">
          這是專屬家人與朋友的小型社群，用來規劃活動、揪人投票、分享日常、做自己的頁面。
          像 Facebook 動態，但只有你信任的人會看到。
        </p>
      </div>

      <Section title="① 你能做什麼" emoji="🌿">
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li>📰 <strong>看動態 / 發文</strong>：左邊欄按「動態」，按右上角「+ 寫一篇文章」就能分享。</li>
          <li>🍖 <strong>辦活動</strong>：上方選單「建立：活動」。設好時間地點，家人朋友會收到通知，可以 RSVP（會去 / 可能 / 不去）。</li>
          <li>📊 <strong>起投票</strong>：選「建立：投票」。支援多選、匿名、家人也能新增選項。也能做 Doodle 風格的「找共同時間」。</li>
          <li>📅 <strong>行事曆</strong>：所有活動都會出現在月曆上，可以一眼看到下個月的計畫。</li>
          <li>🏨 <strong>住宿筆記</strong>：把住過或想推薦的飯店民宿存下來，依地區整理。下次在同一個地區辦活動時會自動跳出來給你參考。</li>
          <li>📄 <strong>自訂頁面</strong>：每個人都可以做自己的頁面（食譜、回憶、清單⋯⋯），可選擇自己看或所有成員看。</li>
          <li>💬 <strong>留言 + 按讚</strong>：每篇文章 / 活動 / 投票都能留言、按愛心。</li>
          <li>✨ <strong>AI 助手</strong>：寫不出文章開頭？想不到活動點子？選單按「AI」找 AI 聊聊。</li>
        </ul>
      </Section>

      <Section title="② 內容生命週期（像 FB 一樣）" emoji="🌀">
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li>自己發的文章 / 活動 / 投票，可以從右上角「⋯」<strong>編輯、隱藏、刪除</strong>。</li>
          <li>活動結束 90 天後會自動從列表隱藏；投票截止 30 天後也會自動退場。直接打開連結還是看得到，只是不會一直擋在大家眼前。</li>
          <li>管理員可以隱藏 / 刪除任何人發的內容（用於處理違規或誤發）。</li>
        </ul>
      </Section>

      <Section title="③ 加入家人朋友" emoji="🎁">
        <p className="text-sm text-ink/80 leading-relaxed mb-2">
          這是封閉社群，新成員需要<strong>邀請碼</strong>才能加入。
        </p>
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li>
            {canInvite ? (
              <>你目前可以發邀請碼 → <Link href="/app/invites" className="text-terracotta hover:underline">/app/invites</Link></>
            ) : (
              <>想邀請朋友？去 <Link href="/app/permissions" className="text-terracotta hover:underline">/app/permissions</Link> 申請發送權限，管理員審核後就可以發。</>
            )}
          </li>
          <li>對方拿到邀請碼後，在登入頁貼上 → 填基本資料就完成註冊。</li>
        </ul>
      </Section>

      <Section title="④ 權限怎麼分" emoji="🛡">
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li><strong>Member</strong>（一般成員）：發文、投票、留言、辦活動、起投票、做自己的頁面。</li>
          <li><strong>Editor</strong>：上面那些 + 置頂內容、審查留言、刪別人發的東西。</li>
          <li><strong>Admin</strong>：上面那些 + 邀請碼管理、調整角色、看完整分析。</li>
        </ul>
        <p className="text-sm text-ink/65 leading-relaxed mt-2">
          想升級權限？到 <Link href="/app/permissions" className="text-terracotta hover:underline">/app/permissions</Link> 填申請。
          管理員會在 <Link href="/app/permissions" className="text-terracotta hover:underline">收件夾</Link> 看到。
        </p>
      </Section>

      <Section title="⑤ 分析能看什麼" emoji="📊">
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li>
            <strong>所有人</strong>：去 <Link href="/app/analytics" className="text-terracotta hover:underline">/app/analytics</Link>{" "}
            看每個活動的 RSVP 熱度、最熱投票，知道大家對什麼有興趣。
          </li>
          <li>
            <strong>管理員</strong>：同一頁下方多一塊完整的事件儀表板（每小時事件量、最活躍成員、即時事件流）。
            成員管理 / 角色調整在 <Link href="/app/admin" className="text-terracotta hover:underline">/app/admin</Link>。
          </li>
        </ul>
      </Section>

      <Section title="⑥ 快捷小撇步" emoji="⌨️">
        <ul className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <li>右上角 🔔 是通知中心，看誰按你愛心、回你留言。</li>
          <li>把頭像點下去看自己的個人檔案，能改名字、頭像顏色。</li>
          <li>手機上可以「加入主畫面」變成 App（PWA），開起來像原生應用。</li>
          <li>有問題隨時回來這頁。</li>
        </ul>
      </Section>

      <div className="mt-10 rounded-soft border border-sand bg-cream/40 p-5 text-sm text-ink/70 leading-relaxed">
        嗨 <strong className="text-ink">{me.name}</strong>，準備好了就從{" "}
        <Link href="/app/feed" className="text-terracotta hover:underline">動態</Link>{" "}
        或{" "}
        <Link href="/app/activities/new" className="text-terracotta hover:underline">辦個活動</Link>{" "}
        開始吧。
        {isAdmin && <span className="block mt-2 text-xs text-ink/55">你是管理員，記得看一下 <Link href="/app/admin" className="text-terracotta hover:underline">/app/admin</Link> 的工具。</span>}
      </div>
    </main>
  );
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="serif text-xl text-ink mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
      </h2>
      <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
        {children}
      </div>
    </section>
  );
}
