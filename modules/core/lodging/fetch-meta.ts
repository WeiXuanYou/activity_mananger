"use server";
/**
 * "Paste a link, auto-fill the form" for lodging.
 *
 * Given a hotel / B&B page URL, fetch it SERVER-SIDE (no CORS issues) and
 * extract whatever metadata we can — title, image, price, address, region.
 * We read standard, publicly-exposed metadata only:
 *   - OpenGraph tags (og:title, og:image, og:price:amount, …)
 *   - Twitter card tags
 *   - JSON-LD schema.org (Hotel / LodgingBusiness / Product / Offer)
 *   - <title> as a last resort
 *
 * This is NOT scraping a booking site's search results — it's reading the
 * metadata a page voluntarily publishes for link previews (the same data
 * Facebook/LINE show when you paste a link). Legitimate + stable.
 *
 * Safety:
 *   - signed-in only
 *   - http/https only; blocks localhost / private IPs (basic SSRF guard)
 *   - 6s timeout, 2MB cap, follows redirects via fetch default
 */
import { requireCurrentUser } from "@/modules/auth";

export type LodgingMeta = {
  name?: string;
  imageUrl?: string;
  pricePerNight?: number; // whole currency units
  address?: string;
  region?: string;
  description?: string;
};

export type FetchMetaResult =
  | { ok: true; meta: LodgingMeta; sourceUrl: string }
  | { ok: false; error: string };

const MAX_BYTES = 2 * 1024 * 1024;

/** Reject obviously-internal targets to avoid SSRF against the host's LAN. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv4 private / loopback / link-local ranges
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  if (/^169\.254\./.test(h) || h === "0.0.0.0") return true;
  // IPv6 loopback / unique-local
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

export async function fetchLodgingMetaAction(rawUrl: string): Promise<FetchMetaResult> {
  await requireCurrentUser();

  const input = (rawUrl ?? "").trim();
  if (!input) return { ok: false, error: "請貼上連結" };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "連結格式不正確（要以 http:// 或 https:// 開頭）" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "只支援 http / https 連結" };
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false, error: "不支援這個連結" };
  }

  let html: string;
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        // Some sites gate metadata behind a real UA; identify as a normal
        // browser-ish bot. We only read <head> metadata.
        "User-Agent": "Mozilla/5.0 (compatible; TogetherBot/1.0; +link-preview)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return { ok: false, error: `對方網站回應 ${res.status}，無法讀取` };
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) {
      return { ok: false, error: "這個連結不是網頁，無法擷取資訊" };
    }
    // Read with a byte cap so a huge page can't blow up memory.
    const reader = res.body?.getReader();
    if (!reader) {
      html = (await res.text()).slice(0, MAX_BYTES);
    } else {
      const chunks: Uint8Array[] = [];
      let total = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          total += value.length;
          if (total >= MAX_BYTES) break;
        }
      }
      html = new TextDecoder("utf-8").decode(concat(chunks));
    }
  } catch (e) {
    const msg = (e as Error).name === "TimeoutError" ? "讀取逾時，對方網站太慢" : "無法連到這個連結";
    return { ok: false, error: msg };
  }

  const meta = parseMeta(html, url);
  // Nothing useful at all?
  if (!meta.name && !meta.imageUrl && meta.pricePerNight == null && !meta.address) {
    return { ok: false, error: "這個連結沒有可擷取的住宿資訊，請手動填寫" };
  }
  return { ok: true, meta, sourceUrl: url.toString() };
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** Pull a <meta property|name="key" content="..."> value (order-insensitive). */
function metaTag(html: string, key: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return undefined;
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decodeEntities(content.trim()) : undefined;
}

function parseMeta(html: string, url: URL): LodgingMeta {
  const meta: LodgingMeta = {};

  // --- OpenGraph / Twitter ---
  meta.name = metaTag(html, "og:title") || metaTag(html, "twitter:title");
  meta.imageUrl = metaTag(html, "og:image") || metaTag(html, "twitter:image") || metaTag(html, "twitter:image:src");
  meta.description = metaTag(html, "og:description") || metaTag(html, "description");
  const ogPrice = metaTag(html, "og:price:amount") || metaTag(html, "product:price:amount");
  if (ogPrice) {
    const n = Number(ogPrice.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) meta.pricePerNight = Math.round(n);
  }

  // --- JSON-LD (schema.org) ---
  for (const block of extractJsonLd(html)) {
    applyJsonLd(block, meta);
  }

  // --- <title> fallback ---
  if (!meta.name) {
    const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    if (t) meta.name = decodeEntities(t.trim());
  }

  // Resolve a relative og:image against the page URL.
  if (meta.imageUrl) {
    try { meta.imageUrl = new URL(meta.imageUrl, url).toString(); } catch { /* leave as-is */ }
  }

  // Trim absurdly long values.
  if (meta.name) meta.name = meta.name.slice(0, 120);
  if (meta.address) meta.address = meta.address.slice(0, 200);
  if (meta.region) meta.region = meta.region.slice(0, 40);
  if (meta.description) meta.description = meta.description.slice(0, 500);
  return meta;
}

/** Find and JSON.parse every <script type="application/ld+json"> block. */
function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw) continue;
    try { out.push(JSON.parse(raw)); } catch { /* skip malformed */ }
  }
  return out;
}

/** Walk a JSON-LD value (may be array / @graph) and fill missing meta. */
function applyJsonLd(node: unknown, meta: LodgingMeta): void {
  if (Array.isArray(node)) {
    for (const n of node) applyJsonLd(n, meta);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj["@graph"])) applyJsonLd(obj["@graph"], meta);

  const type = String(obj["@type"] ?? "").toLowerCase();
  const isLodging = /hotel|lodging|resort|hostel|motel|bedandbreakfast|product|place/.test(type);

  if (isLodging) {
    if (!meta.name && typeof obj.name === "string") meta.name = obj.name;
    if (!meta.description && typeof obj.description === "string") meta.description = obj.description;
    // image can be string | string[] | { url }
    if (!meta.imageUrl) {
      const img = obj.image;
      if (typeof img === "string") meta.imageUrl = img;
      else if (Array.isArray(img) && typeof img[0] === "string") meta.imageUrl = img[0];
      else if (img && typeof img === "object" && typeof (img as Record<string, unknown>).url === "string") {
        meta.imageUrl = (img as Record<string, string>).url;
      }
    }
    // address: PostalAddress object or string
    const addr = obj.address;
    if (addr && typeof addr === "object") {
      const a = addr as Record<string, unknown>;
      const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry]
        .filter((x): x is string => typeof x === "string");
      if (!meta.address && parts.length) meta.address = parts.join(" ");
      if (!meta.region && typeof a.addressLocality === "string") meta.region = a.addressLocality;
      else if (!meta.region && typeof a.addressRegion === "string") meta.region = a.addressRegion;
    } else if (typeof addr === "string" && !meta.address) {
      meta.address = addr;
    }
    // price via offers
    if (meta.pricePerNight == null) {
      const offers = obj.offers;
      const offerObj = Array.isArray(offers) ? offers[0] : offers;
      if (offerObj && typeof offerObj === "object") {
        const price = (offerObj as Record<string, unknown>).price ?? (offerObj as Record<string, unknown>).lowPrice;
        const n = Number(String(price ?? "").replace(/[^0-9.]/g, ""));
        if (Number.isFinite(n) && n > 0) meta.pricePerNight = Math.round(n);
      }
    }
  }
}

/** Minimal HTML entity decode for the handful that show up in metadata. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2f;/gi, "/")
    .replace(/&nbsp;/g, " ");
}
