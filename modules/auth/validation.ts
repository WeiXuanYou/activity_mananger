/**
 * Profile-field validation — shared by the setup flow, the
 * account-settings flow, and the client forms.
 *
 * Deliberately **isomorphic**: no imports of `next/*`, the DB, or any
 * `server-only` shim, so the exact same rules run in the browser (for
 * instant inline feedback) and on the server (the authoritative check).
 * Keeping one copy means a rule change — say, allowing longer handles —
 * happens in one place and can't drift between the two screens that edit
 * a profile.
 *
 * What lives here: pure FORMAT + normalization rules. What does NOT:
 *   - uniqueness (needs the DB) — stays in the server actions
 *   - policy (is email required? can it be cleared?) — stays in the
 *     actions, because it differs between "first setup" and "edit later"
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HANDLE_RE = /^[a-z0-9-]{2,24}$/;
export const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
/** Inline avatar data-URLs we accept. http(s)/blob/javascript schemes
 *  are rejected so a profile can't hot-link a tracking pixel or worse. */
export const AVATAR_IMAGE_RE = /^data:image\/(png|jpeg|webp|gif);base64,/;
/** ~600 KB of base64 ≈ ~450 KB raw — fits a phone snapshot, keeps the
 *  User row readable. Forms pre-resize client-side to stay well under. */
export const AVATAR_MAX_BYTES = 600_000;

/** The avatar background colors offered in the pickers and used to pick
 *  a random color for invite-created users. Single source of truth. */
export const AVATAR_PALETTE = [
  "#C75B3A", "#7A8E6E", "#D4A574", "#8FA7B7",
  "#B58FBF", "#D98090", "#7AA68F", "#E5994A",
  "#5B7B9F", "#8E6A3D",
] as const;

/** Discriminated result so callers `if (r.ok)` and get a typed value,
 *  else a ready-to-show error message. */
export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();
export const normalizeHandle = (raw: string): string => raw.trim().toLowerCase();

export function validateName(raw: string): FieldResult<string> {
  const name = raw.trim();
  if (!name) return { ok: false, error: "請填名字" };
  if (name.length > 40) return { ok: false, error: "名字太長（上限 40 字）" };
  return { ok: true, value: name };
}

export function validateHandle(raw: string): FieldResult<string> {
  const handle = normalizeHandle(raw);
  if (!HANDLE_RE.test(handle)) {
    return { ok: false, error: "暱稱限 2-24 字小寫英數與 -" };
  }
  return { ok: true, value: handle };
}

export function validateAvatarColor(raw: string): FieldResult<string> {
  const color = raw.trim();
  if (!COLOR_RE.test(color)) return { ok: false, error: "頭像顏色格式不對" };
  return { ok: true, value: color };
}

/** Email FORMAT validation. Required-ness is the caller's policy. */
export function validateEmail(raw: string): FieldResult<string> {
  const email = normalizeEmail(raw);
  if (!email) return { ok: false, error: "請填 Email" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email 格式看起來不太對" };
  return { ok: true, value: email };
}

/**
 * Validate an optional avatar-image field with the tri-state contract
 * shared by both forms:
 *   - `undefined` → leave the existing image untouched
 *   - `""`        → clear it (revert to the initial+color circle)
 *   - data URL    → a new upload
 * Returns the same tri-state on success so the action can spread it.
 */
export function validateAvatarImage(
  v: string | undefined,
): FieldResult<string | null | undefined> {
  if (v === undefined) return { ok: true, value: undefined };
  if (v === "") return { ok: true, value: null };
  if (!AVATAR_IMAGE_RE.test(v)) {
    return { ok: false, error: "頭像格式不對（只接受 png / jpeg / webp / gif）" };
  }
  if (v.length > AVATAR_MAX_BYTES) {
    return { ok: false, error: "頭像太大（請壓到 500KB 以下）" };
  }
  return { ok: true, value: v };
}

/** Parse an optional YYYY-MM-DD birthday with the tri-state contract:
 *  `undefined` → untouched, `null`/`""` → cleared, else a Date. */
export function validateBirthday(
  v: string | null | undefined,
): FieldResult<Date | null | undefined> {
  if (v === undefined) return { ok: true, value: undefined };
  if (v === null || v === "") return { ok: true, value: null };
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "生日格式不對" };
  return { ok: true, value: d };
}
