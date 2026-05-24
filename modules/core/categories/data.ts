import type { Category } from "./types";

export const categories: Category[] = [
  // Defaults (system-seeded)
  { id: "c-life",   slug: "life",   name: "生活", emoji: "🌱", color: "sage",       isDefault: true },
  { id: "c-food",   slug: "food",   name: "美食", emoji: "🍱", color: "terracotta", isDefault: true },
  { id: "c-travel", slug: "travel", name: "旅遊", emoji: "✈️", color: "sky",        isDefault: true },
  { id: "c-family", slug: "family", name: "家事", emoji: "🏠", color: "cream",      isDefault: true },
  { id: "c-friends",slug: "friends",name: "朋友聚會", emoji: "🍻", color: "rose",   isDefault: true },
  { id: "c-hobby",  slug: "hobby",  name: "興趣", emoji: "🎨", color: "lavender",   isDefault: true },
  { id: "c-health", slug: "health", name: "健康", emoji: "💪", color: "sage",       isDefault: true },
  { id: "c-recommend", slug: "recommend", name: "推薦", emoji: "⭐", color: "terracotta", isDefault: true },
  { id: "c-gift",   slug: "gift",   name: "禮物", emoji: "🎁", color: "rose",       isDefault: true },

  // User-created
  { id: "c-weekend",     slug: "weekend",     name: "週末計畫", emoji: "🌤", color: "sky",      isDefault: false, createdById: "u2", description: "媽媽建立的：所有週末聚會與小活動" },
  { id: "c-grandpa",     slug: "grandpa",     name: "外公的故事", emoji: "👴", color: "sand",   isDefault: false, createdById: "u1", description: "阿嬤建立的：紀錄外公的故事" },
];
