import { describe, it, expect } from "vitest";
import { extractMentions, splitMentions } from "./parse";

describe("extractMentions", () => {
  it("pulls unique lowercased handles", () => {
    expect(extractMentions("hi @Grandma and @ming and @grandma")).toEqual(["grandma", "ming"]);
  });

  it("returns empty for no mentions", () => {
    expect(extractMentions("just some text")).toEqual([]);
  });

  it("does not swallow CJK after a stray @", () => {
    // "@" followed by CJK is not a handle (handles are ASCII).
    expect(extractMentions("聯絡 @ 阿嬤")).toEqual([]);
  });

  it("ignores single-char handles (min length 2)", () => {
    expect(extractMentions("@a @bb")).toEqual(["bb"]);
  });

  it("handles handles with hyphen / underscore / digits", () => {
    expect(extractMentions("@new-member_42 hi")).toEqual(["new-member_42"]);
  });
});

describe("splitMentions", () => {
  it("splits text and mention segments in order", () => {
    const segs = splitMentions("hi @ming see this");
    expect(segs).toEqual([
      { type: "text", value: "hi " },
      { type: "mention", handle: "ming", raw: "@ming" },
      { type: "text", value: " see this" },
    ]);
  });

  it("handles a mention at the very start and end", () => {
    const segs = splitMentions("@a_start middle @z_end");
    expect(segs[0]).toEqual({ type: "mention", handle: "a_start", raw: "@a_start" });
    expect(segs[segs.length - 1]).toEqual({ type: "mention", handle: "z_end", raw: "@z_end" });
  });

  it("returns a single text segment when there are no mentions", () => {
    expect(splitMentions("plain")).toEqual([{ type: "text", value: "plain" }]);
  });
});
