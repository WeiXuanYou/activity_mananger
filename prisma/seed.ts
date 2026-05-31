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
  Member: [
    "post.create", "comment.create", "page.create", "category.create",
    "activity.create", "poll.create",
  ],
  Editor: [
    "post.create", "post.pin", "post.moderate",
    "activity.create", "activity.moderate",
    "poll.create", "poll.moderate",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create",
  ],
  Admin: [
    "post.create", "post.pin", "post.moderate",
    "activity.create", "activity.moderate",
    "poll.create", "poll.moderate",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create", "invite.create", "admin.approve", "analytics.view",
  ],
};

// Birthdays anchored to "today" and "today+N" at seed time so the demo
// always has data for the upcoming-birthdays widget, regardless of when
// you seed. See `birthdayFor()` below.
const TODAY = new Date();
const birthdayFor = (yearsAgo: number, daysFromToday: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + daysFromToday);
  d.setFullYear(d.getFullYear() - yearsAgo);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Demo members. Each carries an `email` so the seeded data matches the
// real invariant (every setup-completed user has a recovery email) and
// the password/handle-recovery flow can be exercised against demo data.
const MEMBERS = [
  { handle: "grandma", name: "阿嬤",   role: "Admin",  avatarColor: "#C75B3A", initial: "嬤", birthday: birthdayFor(72, 0),  email: "grandma@together.local" },  // 今天就是阿嬤生日
  { handle: "mom",     name: "媽媽",   role: "Editor", avatarColor: "#7A8E6E", initial: "媽", birthday: birthdayFor(48, 5),  email: "mom@together.local"     },  // 5 天後
  { handle: "ming",    name: "小明",   role: "Member", avatarColor: "#D4A574", initial: "明", birthday: birthdayFor(24, 11), email: "ming@together.local"    },  // 11 天後
  { handle: "yating",  name: "雅婷",   role: "Member", avatarColor: "#8FA7B7", initial: "婷", birthday: birthdayFor(28, 200), email: "yating@together.local"  },  // 遠遠以後（驗證 widget 篩選）
  { handle: "jay",     name: "表弟阿傑", role: "Guest",  avatarColor: "#B58FBF", initial: "傑", birthday: null,                email: "jay@together.local"     },
  { handle: "andy",    name: "大學同學 Andy", role: "Member", avatarColor: "#7AA68F", initial: "A", birthday: null,           email: "andy@together.local"    },
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

/**
 * Seed has two modes:
 *
 *   SEED_MODE=demo        → roles + permission matrix + bootstrap admin
 *                            + the rich demo dataset (六位範例家人、活動、
 *                            投票、文章、住宿、自訂頁面、邀請碼). For
 *                            screenshots, /preview, and feature walk-throughs.
 *
 *   SEED_MODE=production  → roles + permission matrix + ONE bootstrap
 *                            admin (admin/admin). Nothing else. This is
 *                            what every fresh install should start with
 *                            so families/friends never inherit somebody
 *                            else's fake content.
 *
 * Production is the **default** — `npm run db:seed` with no env var
 * gives you a clean install. Opt into the demo dataset explicitly via
 * `SEED_MODE=demo npm run db:seed`. /mockup and /preview don't depend
 * on the DB, so the visual tour keeps working in production mode.
 */
const IS_PRODUCTION_SEED = process.env.SEED_MODE !== "demo";

async function main() {
  console.log(`🌱 Seeding... (mode=${IS_PRODUCTION_SEED ? "production" : "demo"})`);

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

  // ───────────────────────────────────────────────────────────────
  // PRODUCTION MODE — stop here with one admin/admin user.
  // ───────────────────────────────────────────────────────────────
  if (IS_PRODUCTION_SEED) {
    // Default credentials: handle="admin", password="admin". `setupCompleted`
    // is FALSE so the first login flow forces them through the setup form,
    // which itself REQUIRES a new password (see `mustResetPassword` in
    // completeSetupAction). We're shipping a known-weak default deliberately
    // because the alternative (random per-install codes) creates a worse UX
    // for self-hosters.
    const { hashPassword } = await import("@/modules/auth/password");
    const defaultPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim() || "admin";
    const passwordHash = await hashPassword(defaultPassword);
    await db.user.upsert({
      where: { handle: "admin" },
      update: { passwordHash, roleId: roleRows.Admin.id },
      create: {
        handle: "admin",
        name: "Admin",
        avatarColor: "#C75B3A",
        initial: "A",
        roleId: roleRows.Admin.id,
        setupCompleted: false, // forces /app/setup on first login
        passwordHash,
      },
    });

    console.log("\n✅ Production seed complete.");
    console.log("\n   Default admin login:");
    console.log(`\n     handle: admin`);
    console.log(`     password: ${defaultPassword}\n`);
    console.log("   On first login you'll be required to:");
    console.log("     1. Pick a real name / handle / avatar");
    console.log("     2. Set a new password (>= 8 chars) to replace the default\n");
    return;
  }

  // ───────────────────────────────────────────────────────────────
  // DEMO MODE — full content below this line
  // ───────────────────────────────────────────────────────────────

  // Demo install ALSO ships an admin/admin login. Same setup-on-first-login
  // flow as production, so anyone testing can experience the real flow.
  const { hashPassword: hashDemoPw } = await import("@/modules/auth/password");
  const demoAdminHash = await hashDemoPw("admin");
  await db.user.upsert({
    where: { handle: "admin" },
    update: { passwordHash: demoAdminHash, roleId: roleRows.Admin.id },
    create: {
      handle: "admin",
      name: "Admin",
      avatarColor: "#C75B3A",
      initial: "A",
      roleId: roleRows.Admin.id,
      setupCompleted: false,
      passwordHash: demoAdminHash,
    },
  });

  // Users
  const userRows: Record<string, { id: string; handle: string; role: string }> = {};
  for (const m of MEMBERS) {
    const u = await db.user.upsert({
      where: { handle: m.handle },
      // Normalize email at write time so the invariant "every stored email
      // matches what `normalizeEmail` would have produced" holds whether
      // the row came from the form or from the seed. Avoids a future
      // `Foo@x.com` row that fails to match a lowercased lookup.
      update: { name: m.name, avatarColor: m.avatarColor, initial: m.initial, roleId: roleRows[m.role].id, birthday: m.birthday ?? null, email: m.email.toLowerCase() },
      create: { handle: m.handle, name: m.name, avatarColor: m.avatarColor, initial: m.initial, roleId: roleRows[m.role].id, birthday: m.birthday ?? null, email: m.email.toLowerCase() },
    });
    userRows[m.handle] = { id: u.id, handle: u.handle, role: m.role };
  }

  // Invite codes — one per role for demo. Marked reusable so /preview-style
  // re-share keeps working (second person redeeming signs back in as the
  // first redeemer's user).
  const codes = [
    { code: "TOGETHER-DEMO-MEMBER", role: "Member", creator: "grandma" },
    { code: "TOGETHER-DEMO-EDITOR", role: "Editor", creator: "grandma" },
    { code: "TOGETHER-DEMO-ADMIN",  role: "Admin",  creator: "grandma" },
    { code: "TOGETHER-DEMO-GUEST",  role: "Guest",  creator: "grandma" },
  ];
  for (const c of codes) {
    await db.inviteCode.upsert({
      where: { code: c.code },
      update: { reusable: true },
      create: {
        code: c.code,
        createdById: userRows[c.creator].id,
        defaultRoleId: roleRows[c.role].id,
        reusable: true,
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
      kind: "STANDARD",
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
      kind: "STANDARD",
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
    // Doodle-style schedule poll — options are ISO datetimes
    {
      question: "下次家族吃飯，大家何時方便？📅", author: "mom",
      kind: "SCHEDULE",
      multiSelect: true, anonymous: false, allowAddOption: true,
      closesAt: "2026-06-15T23:59:00",
      cats: ["food", "family"],
      options: [
        { label: "2026-06-21T18:30", votes: 5, addedBy: null },
        { label: "2026-06-22T19:00", votes: 3, addedBy: null },
        { label: "2026-06-28T12:00", votes: 7, addedBy: null },
        { label: "2026-06-29T18:00", votes: 2, addedBy: null },
      ],
    },
  ];

  const voters = ["grandma", "mom", "ming", "yating", "jay", "andy"];
  for (const p of pollSeed) {
    const poll = await db.poll.create({
      data: {
        question: p.question,
        authorId: userRows[p.author].id,
        kind: p.kind,
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

  // "On this day" demo memories — anchor a post 1y ago and an activity 2y ago
  // to today's MM-DD so the feed widget always has something to surface,
  // regardless of when the seed runs.
  const today = new Date();
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 14, 0, 0);
  const twoYearAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate(), 18, 30, 0);
  const memoryPost = await db.post.create({
    data: {
      authorId: userRows.mom.id,
      kind: "NOTE",
      title: "去年的今天我們在這吃飯",
      body: "翻到去年的照片——一樣這群人，差不多的笑容。時間過得真快。",
      isPinned: false,
      categories: { create: [{ categoryId: catRows.family.id }] },
    },
  });
  await db.$executeRawUnsafe(
    `UPDATE Post SET createdAt = ? WHERE id = ?`, yearAgo.toISOString(), memoryPost.id,
  );
  const memoryActivity = await db.activity.create({
    data: {
      title: "兩年前的家族聚餐",
      description: "翻記憶——當年大家還沒搬走，每月都這樣坐一桌。",
      location: "阿嬤家客廳",
      cover: "linear-gradient(135deg, #E5D7EA 0%, #B58FBF 100%)",
      startsAt: twoYearAgo,
      authorId: userRows.grandma.id,
      categories: { create: [{ categoryId: catRows.family.id }] },
    },
  });
  await db.$executeRawUnsafe(
    `UPDATE Activity SET createdAt = ? WHERE id = ?`, twoYearAgo.toISOString(), memoryActivity.id,
  );

  // "Tomorrow" demo activity — sits within both reminder windows so the
  // admin "▶ 立刻跑一次" button has real notifications to fire on first
  // press. Three users RSVP as GOING.
  const tomorrow = new Date(today.getTime() + 18 * 60 * 60 * 1000);
  const reminderDemo = await db.activity.create({
    data: {
      title: "明天的家族晚餐 (demo)",
      description: "種子產的示範活動——剛好落在 24h 提醒視窗內，按一下管理頁就能看到通知發出來。",
      location: "外公家後院",
      cover: "linear-gradient(135deg, #F4D6BA 0%, #D4A574 100%)",
      startsAt: tomorrow,
      authorId: userRows.grandma.id,
      categories: { create: [{ categoryId: catRows.family.id }] },
    },
  });
  for (const handle of ["mom", "ming", "yating"]) {
    await db.activityParticipant.create({
      data: { activityId: reminderDemo.id, userId: userRows[handle].id, status: "GOING" },
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
    // Build varied block content per page to showcase all 5 renderers
    const blocks = blocksForPage(p.slug);
    await db.customPage.create({
      data: {
        slug: p.slug, title: p.title, ownerId: userRows[p.owner].id,
        excerpt: p.excerpt, cover: p.cover, publishedAt: new Date(),
        categories: { create: p.cats.map((slug) => ({ categoryId: catRows[slug].id })) },
        blocks: { create: blocks },
      },
    });
  }

  // Lodging samples — keyed by region so the activity surfaces have
  // something to hint at. Mix of "past stay" and "recommendation".
  const lodgingSeed = [
    {
      name: "礁溪老爺酒店", region: "宜蘭礁溪",
      address: "宜蘭縣礁溪鄉五峰路 69 號",
      notes: "泡湯不錯，房內也有湯池。早餐 buffet 中等，停車免費。",
      pricePerNightCents: 850000, rating: 4, url: "https://www.hotelroyal.com.tw/chiaohsi/",
      addedBy: "mom", stayedDaysAgo: 200,
    },
    {
      name: "宜蘭悅川酒店", region: "宜蘭",
      notes: "靠近羅東夜市，房間新，適合帶長輩。",
      pricePerNightCents: 620000, rating: 4, url: "https://www.lakeshore.com.tw/zh-tw",
      addedBy: "grandma", stayedDaysAgo: null,
    },
    {
      name: "墾丁夏都沙灘酒店", region: "墾丁",
      address: "屏東縣恆春鎮墾丁路 451 號",
      notes: "直接走出去就是海邊，小朋友超開心。早餐普通。",
      pricePerNightCents: 1200000, rating: 5, url: "https://www.ktchateau.com.tw/",
      addedBy: "andy", stayedDaysAgo: 365,
    },
  ];
  for (const l of lodgingSeed) {
    await db.lodging.create({
      data: {
        name: l.name, region: l.region,
        address: l.address ?? null,
        notes: l.notes ?? null,
        pricePerNightCents: l.pricePerNightCents ?? null,
        currency: "TWD",
        url: l.url ?? null,
        rating: l.rating ?? null,
        addedById: userRows[l.addedBy].id,
        stayedAt: l.stayedDaysAgo != null
          ? new Date(Date.now() - l.stayedDaysAgo * 86400000)
          : null,
      },
    });
  }

  console.log("✅ Seed complete:");
  console.log(`   ${MEMBERS.length} users · ${CATEGORIES.length} categories · ${activitySeed.length} activities · ${pollSeed.length} polls · ${postSeed.length} posts · ${lodgingSeed.length} lodgings`);
  console.log("\n   Try the demo invite codes at /login:");
  for (const c of codes) console.log(`     ${c.code}  →  ${c.role}`);
}

/**
 * Hand-crafted block sequences per page so the demo shows off
 * every renderer (richtext / markdown / html / image / embed-poll).
 */
function blocksForPage(slug: string): { type: string; order: number; data: string }[] {
  if (slug === "family-recipes") {
    return [
      { type: "richtext", order: 0,
        data: JSON.stringify({ html: `<h2>序：為什麼開這個頁面</h2><p>這幾年發現家裡很多菜——尤其是阿嬤、姑姑們的拿手好菜——如果不寫下來，下一代就吃不到了。所以我開了這個頁面，慢慢把它們整理進來。</p>` }),
      },
      { type: "markdown", order: 1,
        data: JSON.stringify({ source: `## 阿嬤的紅燒肉\n\n**材料**\n\n- 五花肉 600g\n- 冰糖 2 大匙\n- 醬油 3 大匙\n- 米酒 100ml\n- 八角、薑、蔥\n\n**步驟**\n\n1. 五花肉切大塊汆燙\n2. 冰糖小火炒成焦糖色\n3. 下肉翻炒上色\n4. 加調味料燉煮 50 分\n\n> 阿嬤的小撇步：冰糖一定要先炒成焦糖色，這樣顏色才會漂亮、香氣才出得來。\n\n| 變化版 | 時間 | 備註 |\n| --- | --- | --- |\n| 加蛋 | +15分 | 提前白煮 |\n| 加豆乾 | 0 | 最後 10 分丟入 |` }),
      },
      { type: "image", order: 2,
        data: JSON.stringify({ url: "linear-gradient(135deg, #F4D6BA 0%, #C75B3A 100%)", caption: "阿嬤做的紅燒肉，是這個頁面的起點。" }),
      },
      { type: "html", order: 3,
        data: JSON.stringify({ source: `<h2>下一道想做的</h2><p>歡迎家人補充。記得加上<strong>份量</strong>跟<em>大概時間</em>。</p><ul><li>三杯雞</li><li>白菜滷</li><li>麻油雞</li></ul>` }),
      },
    ];
  }
  if (slug === "grandpa-stories") {
    return [
      { type: "markdown", order: 0,
        data: JSON.stringify({ source: `# 外公的軍旅故事\n\n外公在民國 50 年到 60 年代於金門服役。這個頁面紀錄他口述的點點滴滴。\n\n## 第一年：剛到金門\n\n外公說，第一次坐船去金門他暈得不行——船小、海浪大，到岸後吐了三天。\n\n## 砲戰之後\n\n外公服役時 8/23 砲戰已經結束多年，但坑道、防空洞還在。他說最深的記憶是夜裡輪班守海邊...` }),
      },
      { type: "image", order: 1,
        data: JSON.stringify({ url: "linear-gradient(135deg, #D4C4A8 0%, #8B7355 100%)", caption: "外公的舊照片掃描檔（之後上傳）" }),
      },
      { type: "richtext", order: 2,
        data: JSON.stringify({ html: `<h3>下次補充：</h3><p>外公答應下次回老家時會把當年的軍中筆記也找出來。</p>` }),
      },
    ];
  }
  if (slug === "friends-travel-log") {
    return [
      { type: "markdown", order: 0,
        data: JSON.stringify({ source: `## 大學同學歷年出遊\n\n從 2016 畢業到現在，我們去過：\n\n- [x] 2016 阿里山畢旅\n- [x] 2018 沖繩跨年\n- [x] 2020 環島（疫情前）\n- [x] 2023 立山黑部\n- [ ] **2026 北海道**（規劃中）` }),
      },
      { type: "html", order: 1,
        data: JSON.stringify({ source: `<p><strong>下次出國想去的餐廳清單</strong>：放這裡讓大家補。</p>` }),
      },
    ];
  }
  // Default — minimal
  return [
    { type: "richtext", order: 0, data: JSON.stringify({ html: `<h2>歡迎</h2><p>這個頁面正在編輯中。</p>` }) },
  ];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
