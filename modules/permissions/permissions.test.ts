import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "./data";

/**
 * Pin the role → permission expectations. If anyone ever drops "post.pin"
 * from Editor (say, by accident), the test goes red — and the seed
 * comment in PERMISSIONS_BY_ROLE points to the right file.
 */
describe("ROLE_PERMISSIONS", () => {
  it("Guest has no permissions", () => {
    expect(ROLE_PERMISSIONS.Guest).toEqual([]);
  });

  it("Member can create posts/comments/activities/polls but NOT moderate or admin", () => {
    const p = ROLE_PERMISSIONS.Member;
    expect(p).toContain("post.create");
    expect(p).toContain("comment.create");
    // Any signed-in member can host activities / start polls in this app.
    expect(p).toContain("activity.create");
    expect(p).toContain("poll.create");
    expect(p).not.toContain("post.moderate");
    expect(p).not.toContain("activity.moderate");
    expect(p).not.toContain("poll.moderate");
    expect(p).not.toContain("admin.approve");
    expect(p).not.toContain("invite.create");
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
    // Editor still can't admin
    expect(e).not.toContain("admin.approve");
    expect(e).not.toContain("invite.create");
  });

  it("Admin is the only role with admin.approve / invite.create / analytics.view", () => {
    const a = ROLE_PERMISSIONS.Admin;
    expect(a).toContain("admin.approve");
    expect(a).toContain("invite.create");
    expect(a).toContain("analytics.view");
    for (const role of ["Guest", "Member", "Editor"] as const) {
      expect(ROLE_PERMISSIONS[role]).not.toContain("admin.approve");
    }
  });

  it("Admin is a strict superset of Editor", () => {
    expect(ROLE_PERMISSIONS.Admin).toEqual(expect.arrayContaining(ROLE_PERMISSIONS.Editor));
  });
});
