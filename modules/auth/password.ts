/**
 * Server-only password hashing using Node's built-in scrypt — no external
 * dependency, no native bindings. Format:
 *
 *   scrypt$<N>$<salt-hex>$<key-hex>
 *
 * The cost factor (N) is stored alongside the hash so we can raise it
 * over time without breaking existing rows: `verifyPassword` reads N
 * from the stored hash, not from a global.
 */
// Note: imports `node:crypto` which is implicitly server-only — but we
// don't add the `server-only` package marker because the seed script
// (a Node CLI, not Next runtime) needs to import this for the bootstrap
// admin's password hash.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const SALT_BYTES = 16;
const DEFAULT_N = 16384; // = 2^14, sane for interactive logins on modest hardware

/** Promise-wrapped scrypt that accepts the options bag. `util.promisify`'s
 *  type strips the options overload, so we hand-wrap it instead. */
function scrypt(password: string | Buffer, salt: Buffer, keylen: number, N: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, { N }, (err, key) => {
      if (err) reject(err); else resolve(key);
    });
  });
}

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length < 1) {
    throw new Error("password must be a non-empty string");
  }
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(plain, salt, KEYLEN, DEFAULT_N);
  return `scrypt$${DEFAULT_N}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Constant-time check. Safe to call with arbitrary user input.
 * Returns false on any error rather than throwing, so callers can
 * `if (!await verifyPassword(...))` without try/catch.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "scrypt") return false;
    const N = Number(parts[1]);
    if (!Number.isFinite(N) || N < 1024) return false;
    const salt = Buffer.from(parts[2], "hex");
    const expected = Buffer.from(parts[3], "hex");
    if (expected.length !== KEYLEN) return false;
    const got = await scrypt(plain, salt, KEYLEN, N);
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}
