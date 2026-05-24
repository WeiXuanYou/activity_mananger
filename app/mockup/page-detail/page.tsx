import Link from "next/link";
import { MockNav } from "../_components/MockNav";
import { customPages, findMember } from "../_data";
import { Avatar } from "../_components/Avatar";

export default function PageDetailMockup() {
  const page = customPages[1];
  const owner = findMember(page.ownerId);

  return (
    <main>
      <MockNav active="/mockup/pages" />
      <div className="max-w-3xl mx-auto px-5 py-8">
        <Link href="/mockup/pages" className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block">
          ← 回頁面書架
        </Link>

        {/* Cover */}
        <div className="h-48 rounded-soft mb-6 relative overflow-hidden" style={{ background: page.cover }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <p className="text-xs tracking-widest font-medium opacity-80 mb-1">CUSTOM PAGE</p>
            <h1 className="serif text-3xl md:text-4xl">{page.title}</h1>
          </div>
        </div>

        {/* Page meta */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Avatar member={owner} size={28} />
            <span className="text-ink/70">由 <span className="font-medium text-ink">{owner.name}</span> 維護</span>
            <span className="text-ink/40">·</span>
            <span className="text-ink/50">3 天前更新</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40">
              ✏️ 編輯
            </button>
            <button className="px-3 py-1.5 rounded-soft bg-white border border-sand text-sm text-ink/70 hover:bg-cream/40">
              ❤️ 24
            </button>
          </div>
        </div>

        {/* Block toolbar (editor mode hint) */}
        <div className="mb-5 bg-sand/40 rounded-soft border border-sand p-3 text-xs text-ink/60 flex items-center gap-3">
          <span className="font-medium">編輯區塊：</span>
          <button className="px-2 py-1 bg-white rounded hover:bg-cream">📝 Rich Text</button>
          <button className="px-2 py-1 bg-white rounded text-ink/40">M↓ Markdown</button>
          <button className="px-2 py-1 bg-white rounded text-ink/40">&lt;/&gt; HTML</button>
          <button className="px-2 py-1 bg-white rounded hover:bg-cream">🖼 圖片</button>
          <button className="px-2 py-1 bg-white rounded hover:bg-cream">📊 嵌入投票</button>
          <span className="ml-auto text-ink/40">Block 渲染器 registry · 可擴充</span>
        </div>

        {/* Blocks */}
        <article className="space-y-6">
          {/* RICHTEXT block */}
          <section className="bg-white rounded-soft shadow-card border border-sand/60 p-7">
            <div className="text-[10px] text-sage-dark font-medium tracking-wider mb-2">BLOCK · RICHTEXT</div>
            <h2 className="serif text-2xl text-ink mb-3">序：為什麼開這個頁面</h2>
            <p className="text-ink/80 leading-relaxed mb-3">
              這幾年發現家裡很多菜——尤其是阿嬤、姑姑們的拿手好菜——如果不寫下來，
              下一代就吃不到了。所以我開了這個頁面，慢慢把它們整理進來。
            </p>
            <p className="text-ink/80 leading-relaxed">
              歡迎家人補充自己的版本，或是留言告訴我「這個你寫錯了，阿嬤是這樣做的」。
            </p>
          </section>

          {/* IMAGE block */}
          <section className="bg-white rounded-soft shadow-card border border-sand/60 overflow-hidden">
            <div className="text-[10px] text-sage-dark font-medium tracking-wider px-7 pt-5">BLOCK · IMAGE</div>
            <div
              className="h-64 mx-7 mt-3 rounded-soft"
              style={{ background: "linear-gradient(135deg, #F4D6BA 0%, #C75B3A 100%)" }}
            />
            <div className="px-7 py-3 text-sm text-ink/60 italic">阿嬤做的紅燒肉，是這個頁面的起點。</div>
          </section>

          {/* RICHTEXT block with recipe */}
          <section className="bg-white rounded-soft shadow-card border border-sand/60 p-7">
            <div className="text-[10px] text-sage-dark font-medium tracking-wider mb-2">BLOCK · RICHTEXT</div>
            <h2 className="serif text-2xl text-ink mb-4">阿嬤的紅燒肉</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-ink/80">
              <div>
                <h3 className="font-semibold text-ink mb-2">材料</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>五花肉 600g</li>
                  <li>冰糖 2 大匙</li>
                  <li>醬油 3 大匙</li>
                  <li>米酒 100ml</li>
                  <li>八角、薑、蔥</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-ink mb-2">步驟</h3>
                <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                  <li>五花肉切大塊汆燙</li>
                  <li>冰糖小火炒成焦糖色</li>
                  <li>下肉翻炒上色</li>
                  <li>加調味料燉煮 50 分</li>
                </ol>
              </div>
            </div>
          </section>

          {/* EMBED block — Poll */}
          <section className="bg-white rounded-soft shadow-card border border-sand/60 p-7">
            <div className="text-[10px] text-sage-dark font-medium tracking-wider mb-3">BLOCK · EMBED / POLL</div>
            <h3 className="serif text-lg text-ink mb-3">下一道想看哪一道？</h3>
            <div className="space-y-2">
              {["三杯雞", "客家小炒", "麻油雞", "白菜滷"].map((label, i) => {
                const pct = [42, 28, 18, 12][i];
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span>{label}</span>
                      <span className="text-ink/50">{pct}%</span>
                    </div>
                    <div className="h-2 bg-sand rounded-full overflow-hidden">
                      <div className="h-full bg-terracotta-soft" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MARKDOWN stub */}
          <section className="bg-cream/40 rounded-soft border-2 border-dashed border-sand p-7 text-center">
            <div className="text-[10px] text-ink/50 font-medium tracking-wider mb-2">BLOCK · MARKDOWN（尚未實作）</div>
            <p className="text-sm text-ink/60">
              這個 block 類型已在 registry 註冊，但渲染器尚未實作。
              <br />
              <span className="text-xs text-ink/40">
                日後加上 markdown renderer 即可顯示——這就是 CMS 模組的可擴充接縫。
              </span>
            </p>
          </section>
        </article>

        {/* Comments */}
        <div className="mt-8 bg-white rounded-soft shadow-card border border-sand/60 p-5">
          <h3 className="serif text-lg text-ink mb-3">💬 留言 (3)</h3>
          <p className="text-sm text-ink/60">家人可以對整個頁面留言或對單一 block 留言。</p>
        </div>
      </div>
    </main>
  );
}
