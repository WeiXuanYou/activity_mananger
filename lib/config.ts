/**
 * Public, deploy-wide config constants.
 *
 * PUBLIC_BASE_URL — the canonical外部網址 used to build links in emails
 * (verification / password reset) and anywhere we need an absolute URL.
 *
 * Resolution order:
 *   1. process.env.APP_URL  — set this to override per-environment.
 *   2. DEFAULT_PUBLIC_URL   — the committed default below, so the URL is
 *      "fixed" and links keep working even if APP_URL isn't set on the box.
 *
 * Change DEFAULT_PUBLIC_URL here if the deployment address ever moves.
 */
const DEFAULT_PUBLIC_URL = "http://my-mc-wx-you.asuscomm.com:416";

/** Normalised (no trailing slash) public base URL. */
export const PUBLIC_BASE_URL = (process.env.APP_URL?.trim() || DEFAULT_PUBLIC_URL).replace(/\/+$/, "");
