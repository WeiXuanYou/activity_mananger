/**
 * Mock aggregations for the dashboard. Phase B+ will query AnalyticsEvent.
 * Importantly: this module does NOT import from core. Aggregations are
 * derived from the event log only.
 */

export type Kpi = { label: string; value: string; delta: string };

export const kpis: Kpi[] = [
  { label: "總投票數", value: "127", delta: "+18" },
  { label: "活動 RSVP", value: "42", delta: "+6" },
  { label: "文章發布", value: "23", delta: "+4" },
  { label: "活躍成員", value: "12 / 15", delta: "+2" },
];

export const trendWeeks = [34, 48, 52, 40, 62, 71, 58, 80, 92, 68, 76, 88];

export const topMembers = [
  { memberId: "u1", score: 42 },
  { memberId: "u2", score: 35 },
  { memberId: "u3", score: 28 },
  { memberId: "u4", score: 21 },
  { memberId: "u6", score: 18 },
];

export const topPosts = [
  { title: "外婆的紅燒肉食譜",  likes: 18, comments: 6 },
  { title: "今天爸爸生日",       likes: 24, comments: 9 },
  { title: "好用的露營椅推薦",   likes: 7,  comments: 3 },
  { title: "畢業十年，我們還是會吵架", likes: 13, comments: 4 },
];

export const votingPatterns = [
  { who: "阿嬤", tag: "傳統口味 / 室內活動", score: "92%" },
  { who: "媽媽", tag: "戶外 / 健康類",        score: "78%" },
  { who: "小明", tag: "新潮口味 / 戶外",      score: "85%" },
  { who: "雅婷", tag: "美食 / 攝影",          score: "71%" },
  { who: "Andy", tag: "夜生活 / 旅遊",        score: "66%" },
];

export const categoryDistribution = [
  { name: "美食",     pct: 28 },
  { name: "家事",     pct: 22 },
  { name: "朋友聚會", pct: 18 },
  { name: "旅遊",     pct: 12 },
  { name: "推薦",     pct: 10 },
  { name: "其他",     pct: 10 },
];
