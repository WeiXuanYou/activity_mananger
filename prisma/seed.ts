/**
 * Seed script — mirrors the mock data in modules/* into the SQLite DB.
 * Run with: `npx prisma db seed`
 *
 * Idempotent: safe to re-run; uses upsert + clearing for join tables.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ROLES = ["Guest", "Member", "Editor", "Admin"] as const;

const PERMISSIONS_BY_ROLE: Record<(typeof ROLES)[number], string[]> = {
  Guest:  [],
  Member: ["post.create", "comment.create", "page.create", "category.create"],
  Editor: [
    "post.create", "post.pin", "activity.create", "poll.create",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create",
  ],
  Admin: [
    "post.create", "post.pin", "activity.create", "poll.create",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create", "invite.create", "admin.approve", "analytics.view",
  ],
};

const MEMBERS = [
  { handle: "grandma", name: "阿嬤",   role: "Admin",  avatarColor: "#C75B3A", initial: "嬤" },
  { handle: "mom",     name: "媽媽",   role: "Editor", avatarColor: "#7A8E6E", initial: "媽" },
  { handle: "ming",    name: "小明",   role: "Member", avatarColor: "#D4A574", initial: "明" },
  { handle: "yating",  name: "雅婷",   role: "Member", avatarColor: "#8FA7B7", initial: "婷" },
  { handle: "jay",     name: "表弟阿傑", role: "Guest",  avatarColor: "#B58FBF", initial: "傑" },
  { handle: "andy",    name: "大學同學 Andy", role: "Member", avatarColor: "#7AA68F", initial: "A" },
];

const CATEGORIES = [
  { slug: "life",     name: "生活",   emoji: "🌱", color: "sage",       isDefault: true },
  { slug: "food",     name: "美食",   emoji: "🍱", color: "terracotta", isDefault: true },
  { slug: "travel",   name: "旅遊",   emoji: "✈️", color: "sky",        isDefault: true },
  { slug: "family",   name: "家事",   emoji: "🏠", color: "cream",      isDefault: true },
  { slug: "friends",  name: "朋友聚會", emoji: "🍻", color: "rose",     isDefault: true },
  { slug: "hobby",    name: "興趣",   emoji: "🎨", color: "lavender",   isDefault: true },
  { slug: "health",   name: "健康",   emoji: "💪", color: "sage",       isDefault: true },
  { slug: "recommend",name: "推薦",   emoji: "⭐", color: "terracotta", isDefault: true },
  { slug: "gift",     name: "禮物",   emoji: "🎁", color: "rose",       isDefault: true },
  { slug: "weekend",  name: "週末計畫", emoji: "🌤", color: "sky",      isDefault: false, ownerHandle: "mom", description: "媽媽建立的：所有週末聚會與小活動" },
  { slug: "grandpa",  name: "外公的故事", emoji: "👴", color: "sand",   isDefault: false, ownerHandle: "grandma", description: "阿嬤建立的：紀錄外公的故事" },
];

async function main() {
  console.log("🌱 Seeding...");

  // Roles
  const roleRows: Record<string, { id: string }> = {};
  for (const name of ROLES) {
    const role = await db.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `${name} role` },
    });
    roleRows[name] = role;
  }

  // Permissions
  const allPermKeys = Array.from(new Set(Object.values(PERMISSIONS_BY_ROLE).flat()));
  const permRows: Record<string, { id: string }> = {};
  for (const key of allPermKeys) {
    const p = await db.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
    permRows[key] = p;
  }

  // RolePermission matrix
  for (const role of ROLES) {
    await db.rolePermission.deleteMany({ where: { roleId: roleRows[role].id } });
    for (const key of PERMISSIONS_BY_ROLE[role]) {
      await db.rolePermission.create({
        data: { roleId: roleRows[role].id, permissionId: permRows[key].id },
      });
    }
  }

  // Users
  const userRows: Record<string, { id: string; handle: string; role: string }> = {};
  for (const m of MEMBERS) {
    const u = await db.user.upsert({
      where: { handle: m.handle },
      update: { name: m.name, avatarColor: m.avatarColor, initial: m.initial, roleId: roleRows[m.role].id },
      create: { handle: m.handle, name: m.name, avatarColor: m.avatarColor, initial: m.initial, roleId: roleRows[m.role].id },
    });
    userRows[m.handle] = { id: u.id, handle: u.handle, role: m.role };
  }

  // Invite codes — one per role for demo
  const codes = [
    { code: "TOGETHER-DEMO-MEMBER", role: "Member", creator: "grandma" },
    { code: "TOGETHER-DEMO-EDITOR", role: "Editor", creator: "grandma" },
    { code: "TOGETHER-DEMO-GUEST",  role: "Guest",  creator: "grandma" },
  ];
  for (const c of codes) {
    await db.inviteCode.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        createdById: userRows[c.creator].id,
        defaultRoleId: roleRows[c.role].id,
      },
    });
  }

  // Categories
  const catRows: Record<string, { id: string }> = {};
  for (const c of CATEGORIES) {
    const owner = c.ownerHandle ? userRows[c.ownerHandle]?.id : undefined;
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, emoji: c.emoji, color: c.color, isDefault: c.isDefault, description: c.description },
      create: {
        slug: c.slug, name: c.name, emoji: c.emoji, color: c.color,
        isDefault: c.isDefault, description: c.description, createdById: owner,
      },
    });
    catRows[c.slug] = row;
  }

  // Wipe content tables we re-seed every time
  await db.activityCategory.deleteMany();
  await db.postCategory.deleteMany();
  await db.pollCategory.deleteMany();
  await db.customPageCategory.deleteMany();
  await db.activityParticipant.deleteMany();
  await db.pollVote.deleteMany();
  await db.pollOption.deleteMany();
  await db.customPageBlock.deleteMany();
  await db.permissionRequest.deleteMany();
  await db.activity.deleteMany();
  await db.poll.deleteMany();
  await db.post.deleteMany();
  await db.customPage.deleteMany();

  // Activities
  const activitySeed = [
    { id: "seed-a-hike",   title: "週末爬山——七星山", host: "mom",   startsAt: "2026-05-31T07:30:00", location: "七星山苗圃登山口", cover: "linear-gradient(135deg, #C5D1BB 0%, #7A8E6E 100%)", going: 5, maybe: 4, declined: 2, description: "天氣涼爽適合爬山，路線約 2.5 小時，新手友善。", cats: ["health", "weekend"] },
    { id: "seed-a-bday",   title: "表姐生日驚喜派對",   host: "ming",  startsAt: "2026-06-15T19:00:00", location: "信義區 Cafe Belle",   cover: "linear-gradient(135deg, #F4D6BA 0%, #D4A574 100%)", going: 8, maybe: 2, declined: 0, description: "別讓表姐知道！我們提前 30 分到場佈置。", cats: ["gift", "friends"] },
    { id: "seed-a-college",title: "大學同學聚會",        host: "andy",  startsAt: "2026-06-22T19:00:00", location: "公館 居酒屋角落",    cover: "linear-gradient(135deg, #F4D4DA 0%, #D98090 100%)", going: 7, maybe: 5, declined: 1, description: "畢業十年聚會，Andy 揪。", cats: ["friends"] },
    { id: "seed-a-bbq",    title: "中秋家族烤肉大會",   host: "grandma", startsAt: "2026-09-25T18:00:00", location: "外公家後院",       cover: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)", going: 12, maybe: 3, declined: 1, description: "今年我們一樣在外公家後院烤肉，請大家準時到，阿嬤會準備柚子湯！", cats: ["family", "food"] },
  ];
  for (const a of activitySeed) {
    const created = await db.activity.create({
      data: {
        title: a.title,
        description: a.description,
        location: a.location,
        cover: a.cover,
        startsAt: new Date(a.startsAt),
        authorId: userRows[a.host].id,
        categories: { create: a.cats.map((slug) => ({ categoryId: catRows[slug].id })) },
      },
    });
    // Just sample some participants
    const sampleGoers = ["grandma", "mom", "ming", "yating"].slice(0, a.going);
    for (const g of sampleGoers) {
      await db.activityParticipant.create({
        data: { activityId: created.id, userId: userRows[g].id, status: "GOING" },
      });
    }
  }

  // Polls
  const pollSeed = [
    {
      question: "中秋烤肉要訂哪一家肉品？🍖", author: "grandma",
      multiSelect: false, anonymous: false, allowAddOption: true,
      closesAt: "2026-09-20T23:59:00",
      cats: ["food", "family"],
      options: [
        { label: "好市多套餐 A", votes: 8, addedBy: null },
        { label: "傳統肉舖阿伯店", votes: 11, addedBy: null },
        { label: "海鮮為主", votes: 3, addedBy: null },
        { label: "素食組合（雅婷補的）", votes: 4, addedBy: "yating" },
      ],
    },
    {
      question: "家族旅遊地點投票 🏝️", author: "mom",
      multiSelect: true, anonymous: true, allowAddOption: false,
      closesAt: "2026-07-01T23:59:00",
      cats: ["travel", "family"],
      options: [
        { label: "宜蘭兩天一夜", votes: 6, addedBy: null },
        { label: "墾丁三天兩夜", votes: 9, addedBy: null },
        { label: "日本京都五天", votes: 4, addedBy: null },
        { label: "在家就好", votes: 2, addedBy: null },
      ],
    },
  ];

  const voters = ["grandma", "mom", "ming", "yating", "jay", "andy"];
  for (const p of pollSeed) {
    const poll = await db.poll.create({
      data: {
        question: p.question,
        authorId: userRows[p.author].id,
        multiSelect: p.multiSelect,
        anonymous: p.anonymous,
        allowAddOption: p.allowAddOption,
        closesAt: new Date(p.closesAt),
        categories: { create: p.cats.map((slug) => ({ categoryId: catRows[slug].id })) },
      },
    });
    for (const [i, opt] of p.options.entries()) {
      const option = await db.pollOption.create({
        data: {
          pollId: poll.id, label: opt.label, order: i,
          addedById: opt.addedBy ? userRows[opt.addedBy].id : null,
        },
      });
      // Cast votes — round-robin among voters up to opt.votes
      for (let v = 0; v < Math.min(opt.votes, voters.length); v++) {
        await db.pollVote.create({
          data: { optionId: option.id, userId: userRows[voters[v]].id },
        });
      }
    }
  }

  // Posts
  const postSeed = [
    { author: "grandma", kind: "NOTE",          title: "📌 相聚使用小提醒",
      body: "歡迎新加入的家人和朋友～這裡是我們的小天地，可以發文、辦活動、投票。要更多權限隨時跟阿嬤說。記得：這裡所有人都看得到，要私訊請走 Line ♡",
      isPinned: true, pinnedBy: "grandma", cats: ["family"] },
    { author: "mom",     kind: "ARTICLE",      title: "外婆的紅燒肉食譜",
      body: "外婆昨天教我她保留了五十年的紅燒肉做法——其實秘訣是冰糖一定要先炒成焦糖色...",
      isPinned: false, cats: ["food", "grandpa"] },
    { author: "ming",    kind: "RECOMMENDATION",title: "好用的露營椅推薦",
      body: "上次烤肉時用到的椅子超推！收納方便、坐墊舒服，重點是台幣 800 有找。",
      isPinned: false, cats: ["recommend", "hobby"] },
    { author: "yating",  kind: "NOTE",          title: null,
      body: "今天爸爸生日，我們訂了他最愛的栗子蛋糕。生日快樂爸爸 🎂",
      isPinned: false, cats: ["family", "gift"] },
    { author: "andy",    kind: "ARTICLE",      title: "畢業十年，我們還是會吵架",
      body: "昨晚同學會結束後，我在回家的路上想了很多。十年了，這群朋友還是會吵會鬧，但散場前還是會擁抱。",
      isPinned: false, cats: ["friends"] },
  ];
  for (const p of postSeed) {
    await db.post.create({
      data: {
        authorId: userRows[p.author].id,
        kind: p.kind, title: p.title, body: p.body,
        isPinned: p.isPinned, pinnedById: p.isPinned && p.pinnedBy ? userRows[p.pinnedBy].id : null,
        categories: { create: p.cats.map((slug) => ({ categoryId: catRows[slug].id })) },
      },
    });
  }

  // Permission requests
  const reqSeed = [
    { user: "ming",   current: "Member", target: "Editor", status: "PENDING",  reason: "想要幫忙籌備中秋活動，需要建立活動與投票的權限。" },
    { user: "yating", current: "Member", target: "Editor", status: "PENDING",  reason: "我會定期整理活動的照片並發佈，想要有置頂與留言審查權限。" },
    { user: "jay",    current: "Guest",  target: "Member", status: "APPROVED", reason: "我是表姐介紹進來的，想要能發文跟投票。" },
  ];
  for (const r of reqSeed) {
    await db.permissionRequest.create({
      data: {
        userId: userRows[r.user].id,
        currentRoleId: roleRows[r.current].id,
        requestedRoleId: roleRows[r.target].id,
        reason: r.reason,
        status: r.status,
        decidedById: r.status !== "PENDING" ? userRows.grandma.id : null,
        decidedAt: r.status !== "PENDING" ? new Date() : null,
      },
    });
  }

  // Custom pages (light seed — no blocks to keep simple)
  const pageSeed = [
    { slug: "grandpa-stories", title: "外公的軍旅故事",   owner: "grandma", excerpt: "外公在金門服役時的點點滴滴，我們一起整理出來給後輩留念。", cover: "linear-gradient(135deg, #D4C4A8 0%, #8B7355 100%)", cats: ["grandpa", "family"] },
    { slug: "family-recipes",  title: "我們家的食譜書",   owner: "mom",     excerpt: "媽媽、阿嬤、姑姑們最拿手的家常菜，照片 + 步驟。",     cover: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)", cats: ["food", "family"] },
    { slug: "friends-travel-log", title: "朋友圈出遊紀錄", owner: "andy",   excerpt: "Andy 整理的：大學同學歷年出遊照片 + 餐廳清單。",   cover: "linear-gradient(135deg, #F4D4DA 0%, #D98090 100%)", cats: ["friends", "travel"] },
  ];
  for (const p of pageSeed) {
    await db.customPage.create({
      data: {
        slug: p.slug, title: p.title, ownerId: userRows[p.owner].id,
        excerpt: p.excerpt, cover: p.cover, publishedAt: new Date(),
        categories: { create: p.cats.map((slug) => ({ categoryId: catRows[slug].id })) },
        blocks: { create: [
          { type: "richtext", order: 0, data: JSON.stringify({ html: `<h2>${p.title}</h2><p>${p.excerpt}</p>` }) },
        ] },
      },
    });
  }

  console.log("✅ Seed complete:");
  console.log(`   ${MEMBERS.length} users · ${CATEGORIES.length} categories · ${activitySeed.length} activities · ${pollSeed.length} polls · ${postSeed.length} posts`);
  console.log("\n   Try the demo invite codes at /login:");
  for (const c of codes) console.log(`     ${c.code}  →  ${c.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
