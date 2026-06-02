import type { Role } from "@/modules/auth";
import type { PermissionKey, PermissionRequest } from "./types";

/** Role → permission matrix. Single source of truth. */
export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  Guest:  [],
  Member: [
    "post.create", "comment.create", "page.create", "category.create",
    // Any signed-in member can host activities / start polls — this isn't
    // a privileged action in a family/friends community.
    "activity.create", "poll.create",
    // Members can invite family/friends by default. Admins can turn this
    // OFF for a specific member with a per-user deny (see guard.ts).
    "invite.create",
  ],
  Editor: [
    "post.create", "post.pin", "post.moderate",
    "activity.create", "activity.moderate",
    "poll.create", "poll.moderate",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create", "invite.create",
  ],
  Admin: [
    "post.create", "post.pin", "post.moderate",
    "activity.create", "activity.moderate",
    "poll.create", "poll.moderate",
    "comment.create", "comment.moderate", "page.create", "page.publish",
    "category.create", "invite.create", "admin.approve", "analytics.view",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  Guest: "Guest（訪客）",
  Member: "Member（成員）",
  Editor: "Editor（編輯）",
  Admin: "Admin（管理員）",
};

export const ROLE_DESCRIPTIONS: Record<Role, string[]> = {
  Guest: ["讀取公開內容"],
  Member: ["讀取所有 PUBLIC / MEMBERS", "發文、按讚、留言", "投票、RSVP", "建立活動、投票", "建立自己的自訂頁面", "建立分類"],
  Editor: ["所有 Member 權限", "置頂內容、審查留言", "發布自訂頁面"],
  Admin: ["所有 Editor 權限", "管理角色與權限", "發出邀請碼", "查看分析儀表板"],
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
    reason: "我會定期整理活動的照片並發佈，想要有置頂與留言審查權限。",
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
