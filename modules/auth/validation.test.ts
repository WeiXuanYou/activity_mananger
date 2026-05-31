import { describe, it, expect } from "vitest";
import {
  validateName,
  validateHandle,
  validateAvatarColor,
  validateEmail,
  validateAvatarImage,
  validateBirthday,
  validatePassword,
  normalizeEmail,
  normalizeHandle,
  AVATAR_MAX_BYTES,
  AVATAR_PALETTE,
  MIN_PASSWORD_LEN,
} from "./validation";

/** Build a data URL whose body starts with the given file-signature bytes
 *  followed by zero padding. Used to exercise the magic-bytes check. */
function dataUrlWithMagic(mime: "png" | "jpeg" | "webp" | "gif", magic: number[]): string {
  const buf = Buffer.concat([Buffer.from(magic), Buffer.alloc(32)]);
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}
const PNG_MAGIC  = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const JPEG_MAGIC = [0xFF, 0xD8, 0xFF];
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46];
const GIF_MAGIC  = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];

/**
 * These rules are the single source of truth for profile-field format,
 * shared by the setup flow, account-settings flow, and the client forms.
 * Pinning them here means a change on one screen can't silently diverge
 * from the other.
 */
describe("validateName", () => {
  it("trims and accepts a normal name", () => {
    expect(validateName("  阿嬤 ")).toEqual({ ok: true, value: "阿嬤" });
  });
  it("rejects empty", () => {
    expect(validateName("   ").ok).toBe(false);
  });
  it("rejects > 40 chars", () => {
    expect(validateName("x".repeat(41)).ok).toBe(false);
  });
});

describe("validateHandle", () => {
  it("lowercases and accepts a-z0-9-", () => {
    expect(validateHandle("  Grandma-01 ")).toEqual({ ok: true, value: "grandma-01" });
  });
  it("rejects too short", () => {
    expect(validateHandle("a").ok).toBe(false);
  });
  it("rejects illegal chars", () => {
    expect(validateHandle("hi there").ok).toBe(false);
    expect(validateHandle("用戶").ok).toBe(false);
  });
  it("rejects > 24 chars", () => {
    expect(validateHandle("a".repeat(25)).ok).toBe(false);
  });
});

describe("validateAvatarColor", () => {
  it("accepts 6-digit hex", () => {
    expect(validateAvatarColor("#C75B3A")).toEqual({ ok: true, value: "#C75B3A" });
  });
  it("rejects non-hex / short", () => {
    expect(validateAvatarColor("red").ok).toBe(false);
    expect(validateAvatarColor("#fff").ok).toBe(false);
  });
  it("every palette color is itself valid", () => {
    for (const c of AVATAR_PALETTE) expect(validateAvatarColor(c).ok).toBe(true);
  });
});

describe("validateEmail", () => {
  it("normalizes (trim + lowercase)", () => {
    expect(validateEmail("  Foo@Bar.COM ")).toEqual({ ok: true, value: "foo@bar.com" });
  });
  it("rejects empty and malformed", () => {
    expect(validateEmail("").ok).toBe(false);
    expect(validateEmail("nope").ok).toBe(false);
    expect(validateEmail("a@b").ok).toBe(false);
    expect(validateEmail("a @b.com").ok).toBe(false);
  });
});

describe("validateAvatarImage (tri-state + magic-bytes)", () => {
  it("undefined → leave untouched", () => {
    expect(validateAvatarImage(undefined)).toEqual({ ok: true, value: undefined });
  });
  it("empty string → clear (null)", () => {
    expect(validateAvatarImage("")).toEqual({ ok: true, value: null });
  });
  it("accepts a real PNG signature", () => {
    const v = dataUrlWithMagic("png", PNG_MAGIC);
    expect(validateAvatarImage(v)).toEqual({ ok: true, value: v });
  });
  it("accepts a real JPEG signature", () => {
    const v = dataUrlWithMagic("jpeg", JPEG_MAGIC);
    expect(validateAvatarImage(v).ok).toBe(true);
  });
  it("accepts a real WebP signature", () => {
    const v = dataUrlWithMagic("webp", WEBP_MAGIC);
    expect(validateAvatarImage(v).ok).toBe(true);
  });
  it("accepts a real GIF89a signature", () => {
    const v = dataUrlWithMagic("gif", GIF_MAGIC);
    expect(validateAvatarImage(v).ok).toBe(true);
  });
  it("rejects mime/magic mismatch (PNG mime + JPEG body)", () => {
    const v = dataUrlWithMagic("png", JPEG_MAGIC);
    expect(validateAvatarImage(v).ok).toBe(false);
  });
  it("rejects garbage body claiming to be PNG (smuggling check)", () => {
    expect(validateAvatarImage("data:image/png;base64,AAAA").ok).toBe(false);
  });
  it("rejects non-image / wrong scheme", () => {
    expect(validateAvatarImage("https://evil/x.png").ok).toBe(false);
    expect(validateAvatarImage("data:text/html;base64,AAAA").ok).toBe(false);
  });
  it("rejects oversize", () => {
    const big = "data:image/png;base64," + "A".repeat(AVATAR_MAX_BYTES + 1);
    expect(validateAvatarImage(big).ok).toBe(false);
  });
});

describe("validatePassword", () => {
  it("rejects empty / too short", () => {
    expect(validatePassword("").ok).toBe(false);
    expect(validatePassword("a".repeat(MIN_PASSWORD_LEN - 1)).ok).toBe(false);
  });
  it("accepts minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LEN))).toEqual({
      ok: true,
      value: "a".repeat(MIN_PASSWORD_LEN),
    });
  });
});

describe("validateBirthday (tri-state)", () => {
  it("undefined → untouched, null/'' → cleared", () => {
    expect(validateBirthday(undefined)).toEqual({ ok: true, value: undefined });
    expect(validateBirthday(null)).toEqual({ ok: true, value: null });
    expect(validateBirthday("")).toEqual({ ok: true, value: null });
  });
  it("parses a valid date", () => {
    const r = validateBirthday("1990-05-31");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeInstanceOf(Date);
  });
  it("rejects garbage", () => {
    expect(validateBirthday("not-a-date").ok).toBe(false);
  });
});

describe("normalizers", () => {
  it("normalizeEmail / normalizeHandle lowercase + trim", () => {
    expect(normalizeEmail("  A@B.CoM ")).toBe("a@b.com");
    expect(normalizeHandle("  GrandMa ")).toBe("grandma");
  });
});
