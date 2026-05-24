export type Member = {
  id: string;
  name: string;
  handle: string;
  role: "Guest" | "Member" | "Editor" | "Admin";
  avatarColor: string;
  initial: string;
};

export const members: Member[] = [
  { id: "u1", name: "阿嬤", handle: "grandma", role: "Admin", avatarColor: "#C75B3A", initial: "嬤" },
  { id: "u2", name: "媽媽", handle: "mom", role: "Editor", avatarColor: "#7A8E6E", initial: "媽" },
  { id: "u3", name: "小明", handle: "ming", role: "Member", avatarColor: "#D4A574", initial: "明" },
  { id: "u4", name: "雅婷", handle: "yating", role: "Member", avatarColor: "#8FA7B7", initial: "婷" },
  { id: "u5", name: "表弟阿傑", handle: "jay", role: "Guest", avatarColor: "#B58FBF", initial: "傑" },
];

export type Activity = {
  id: string;
  title: string;
  hostId: string;
  startsAt: string;
  location: string;
  cover: string;
  rsvp: { going: number; maybe: number; declined: number };
  description: string;
};

export const activities: Activity[] = [
  {
    id: "a1",
    title: "中秋家族烤肉大會",
    hostId: "u1",
    startsAt: "2026-09-25 18:00",
    location: "外公家後院",
    cover: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)",
    rsvp: { going: 12, maybe: 3, declined: 1 },
    description: "今年我們一樣在外公家後院烤肉，請大家準時到，阿嬤會準備柚子湯！",
  },
  {
    id: "a2",
    title: "週末爬山——七星山",
    hostId: "u2",
    startsAt: "2026-06-07 07:30",
    location: "七星山苗圃登山口",
    cover: "linear-gradient(135deg, #C5D1BB 0%, #7A8E6E 100%)",
    rsvp: { going: 5, maybe: 4, declined: 2 },
    description: "天氣涼爽適合爬山，路線約 2.5 小時，新手友善。",
  },
  {
    id: "a3",
    title: "表姐生日驚喜派對",
    hostId: "u3",
    startsAt: "2026-06-15 19:00",
    location: "信義區 Cafe Belle",
    cover: "linear-gradient(135deg, #F4D6BA 0%, #D4A574 100%)",
    rsvp: { going: 8, maybe: 2, declined: 0 },
    description: "別讓表姐知道！我們提前 30 分到場佈置。",
  },
];

export type Poll = {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  totalVotes: number;
  closesAt: string;
};

export const polls: Poll[] = [
  {
    id: "p1",
    question: "中秋烤肉要訂哪一家肉品？",
    options: [
      { id: "o1", label: "好市多套餐 A", votes: 8 },
      { id: "o2", label: "傳統肉舖阿伯店", votes: 11 },
      { id: "o3", label: "海鮮為主", votes: 3 },
    ],
    totalVotes: 22,
    closesAt: "2026-09-20",
  },
  {
    id: "p2",
    question: "家族旅遊地點投票",
    options: [
      { id: "o1", label: "宜蘭兩天一夜", votes: 6 },
      { id: "o2", label: "墾丁三天兩夜", votes: 9 },
      { id: "o3", label: "日本京都五天", votes: 4 },
      { id: "o4", label: "在家就好", votes: 2 },
    ],
    totalVotes: 21,
    closesAt: "2026-07-01",
  },
];

export type Post = {
  id: string;
  authorId: string;
  kind: "ARTICLE" | "RECOMMENDATION" | "NOTE";
  title?: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
};

export const posts: Post[] = [
  {
    id: "po1",
    authorId: "u2",
    kind: "ARTICLE",
    title: "外婆的紅燒肉食譜",
    body: "外婆昨天教我她保留了五十年的紅燒肉做法——其實秘訣是冰糖一定要先炒成焦糖色...",
    likes: 18,
    comments: 6,
    createdAt: "2 小時前",
  },
  {
    id: "po2",
    authorId: "u3",
    kind: "RECOMMENDATION",
    title: "好用的露營椅推薦",
    body: "上次烤肉時用到的椅子超推！收納方便、坐墊舒服，重點是台幣 800 有找。",
    likes: 7,
    comments: 3,
    createdAt: "昨天",
  },
  {
    id: "po3",
    authorId: "u4",
    kind: "NOTE",
    body: "今天爸爸生日，我們訂了他最愛的栗子蛋糕。生日快樂爸爸 🎂",
    likes: 24,
    comments: 9,
    createdAt: "3 天前",
  },
];

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export const sampleComments: Comment[] = [
  { id: "c1", authorId: "u1", body: "好懷念這個味道～阿嬤等你回來煮給我吃。", createdAt: "1 小時前" },
  { id: "c2", authorId: "u3", body: "求食譜！我下週也想試試看。", createdAt: "30 分鐘前" },
  { id: "c3", authorId: "u4", body: "我來訂醬油，最近發現一家很好的釀造廠。", createdAt: "10 分鐘前" },
];

export type CustomPage = {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  excerpt: string;
  cover: string;
  blocks: number;
};

export const customPages: CustomPage[] = [
  {
    id: "cp1",
    slug: "grandpa-stories",
    title: "外公的軍旅故事",
    ownerId: "u1",
    excerpt: "外公在金門服役時的點點滴滴，我們一起整理出來給後輩留念。",
    cover: "linear-gradient(135deg, #D4C4A8 0%, #8B7355 100%)",
    blocks: 6,
  },
  {
    id: "cp2",
    slug: "family-recipes",
    title: "我們家的食譜書",
    ownerId: "u2",
    excerpt: "媽媽、阿嬤、姑姑們最拿手的家常菜，照片 + 步驟。",
    cover: "linear-gradient(135deg, #E8B5A2 0%, #C75B3A 100%)",
    blocks: 12,
  },
  {
    id: "cp3",
    slug: "kid-album",
    title: "小毛的成長日記",
    ownerId: "u4",
    excerpt: "0 歲到現在的有趣瞬間，定期更新。",
    cover: "linear-gradient(135deg, #C5D1BB 0%, #7A8E6E 100%)",
    blocks: 24,
  },
  {
    id: "cp4",
    slug: "family-tree",
    title: "家族樹狀圖",
    ownerId: "u1",
    excerpt: "三代以內的親戚關係圖，幫年輕一輩搞清楚怎麼叫人。",
    cover: "linear-gradient(135deg, #B58FBF 0%, #6B4D78 100%)",
    blocks: 3,
  },
];

export type PermissionRequest = {
  id: string;
  userId: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export const permissionRequests: PermissionRequest[] = [
  {
    id: "pr1",
    userId: "u3",
    currentRole: "Member",
    requestedRole: "Editor",
    reason: "想要幫忙籌備中秋活動，需要建立活動與投票的權限。",
    status: "PENDING",
    createdAt: "2 小時前",
  },
  {
    id: "pr2",
    userId: "u4",
    currentRole: "Member",
    requestedRole: "Editor",
    reason: "我會定期整理家族活動的照片並發佈，想要有置頂與留言審查權限。",
    status: "PENDING",
    createdAt: "昨天",
  },
  {
    id: "pr3",
    userId: "u5",
    currentRole: "Guest",
    requestedRole: "Member",
    reason: "我是表姐介紹進來的，想要能發文跟投票。",
    status: "APPROVED",
    createdAt: "上週",
  },
];

export const findMember = (id: string) => members.find((m) => m.id === id)!;
