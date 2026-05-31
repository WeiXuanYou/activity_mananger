import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "./data";
import { resolvePermission } from "./resolve";

/**
 * Pin the role → permission expectations. If anyone ever drops "post.pin"
 * from Editor (say, by accident), the test goes red — and the seed
 * comment in PERMISSIONS_BY_ROLE points to the right file.
 */
describe("ROLE_PERMISSIONS", () => {
  it("Guest has no permissions", () => {
    expect(ROLE_PERMISSIONS.Guest).toEqual([]);
  });

  it("Member can create posts/comments/activities/polls + invite, but NOT moderate or admin", () => {
    const p = ROLE_PERMISSIONS.Member;
    expect(p).toContain("post.create");
    expect(p).toContain("comment.create");
    // Any signed-in member can host activities / start polls in this app.
    expect(p).toContain("activity.create");
    expect(p).toContain("poll.create");
    // Members can invite family/friends by default (admins can deny per-user).
    expect(p).toContain("invite.create");
    expect(p).not.toContain("post.moderate");
    expect(p).not.toContain("activity.moderate");
    expect(p).not.toContain("poll.moderate");
    expect(p).not.toContain("admin.approve");
  });

  it("Editor includes Member perms plus moderation/pin and content creation", () => {
    const e = ROLE_PERMISSIONS.Editor;
    expect(e).toEqual(expect.arrayContaining(ROLE_PERMISSIONS.Member));
    expect(e).toContain("post.pin");
    expect(e).toContain("post.moderate");
    expect(e).toContain("activity.create");
    expect(e).toContain("activity.moderate");
    expect(e).toContain("poll.create");
    expect(e).toContain("poll.moderate");
    expect(e).toContain("comment.moderate");
    expect(e).toContain("page.publish");
    expect(e).toContain("invite.create");
    // Editor still can't admin
    expect(e).not.toContain("admin.approve");
  });

  it("Admin is the only role with admin.approve / analytics.view; invite is shared down to Member", () => {
    const a = ROLE_PERMISSIONS.Admin;
    expect(a).toContain("admin.approve");
    expect(a).toContain("invite.create");
    expect(a).toContain("analytics.view");
    for (const role of ["Guest", "Member", "Editor"] as const) {
      expect(ROLE_PERMISSIONS[role]).not.toContain("admin.approve");
      expect(ROLE_PERMISSIONS[role]).not.toContain("analytics.view");
    }
    // invite.create is intentionally available to Member + Editor now.
    expect(ROLE_PERMISSIONS.Member).toContain("invite.create");
    expect(ROLE_PERMISSIONS.Editor).toContain("invite.create");
    expect(ROLE_PERMISSIONS.Guest).not.toContain("invite.create");
  });

  it("Admin is a strict superset of Editor", () => {
    expect(ROLE_PERMISSIONS.Admin).toEqual(expect.arrayContaining(ROLE_PERMISSIONS.Editor));
  });
});

describe("resolvePermission (grant / deny override logic)", () => {
  // The everyday case: a Member's role grants invite.create.
  it("role grant with no overrides → allowed", () => {
    expect(resolvePermission({ role: "Member", permission: "invite.create", hasGrant: false, hasDeny: false })).toBe(true);
  });

  it("role does not grant + no grant override → denied", () => {
    expect(resolvePermission({ role: "Guest", permission: "invite.create", hasGrant: false, hasDeny: false })).toBe(false);
  });

  it("a per-user deny removes a role-granted permission for a Member", () => {
    expect(resolvePermission({ role: "Member", permission: "invite.create", hasGrant: false, hasDeny: true })).toBe(false);
  });

  it("an explicit grant re-enables a denied permission (grant wins)", () => {
    expect(resolvePermission({ role: "Member", permission: "invite.create", hasGrant: true, hasDeny: true })).toBe(true);
  });

  it("a Guest can be granted invite.create explicitly", () => {
    expect(resolvePermission({ role: "Guest", permission: "invite.create", hasGrant: true, hasDeny: false })).toBe(true);
  });

  it("Admins are NEVER denied, even with a deny row", () => {
    expect(resolvePermission({ role: "Admin", permission: "invite.create", hasGrant: false, hasDeny: true })).toBe(true);
    expect(resolvePermission({ role: "Admin", permission: "admin.approve", hasGrant: false, hasDeny: true })).toBe(true);
  });

  it("a deny on a permission the role never had is a no-op (already denied)", () => {
    expect(resolvePermission({ role: "Member", permission: "admin.approve", hasGrant: false, hasDeny: true })).toBe(false);
  });
});
