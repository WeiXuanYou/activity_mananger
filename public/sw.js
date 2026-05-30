/* 相聚 Service Worker
 *
 * Minimal offline shell:
 *   - PRECACHE the static assets needed for first-paint when offline
 *     (the login page, the icon, the manifest).
 *   - NETWORK-FIRST for HTML so logged-in users see fresh content; fall
 *     back to a cached generic shell only when the network is dead.
 *   - CACHE-FIRST for /uploads/* images (the heavy stuff).
 *
 * Intentionally small. A "real" PWA framework (next-pwa, Workbox) would
 * give us hash-based asset matching, but at family-scale this hand-rolled
 * SW does the job and is auditable in 80 lines.
 */
const VERSION = "v1";
const STATIC_CACHE = `together-static-${VERSION}`;
const IMG_CACHE = `together-img-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/login",
  "/icon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Drop old versions so a re-deploy doesn't accumulate cruft
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Cache-first for uploaded images — they never change for a given URL
  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const fresh = await fetch(req).catch(() => null);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh ?? new Response("offline", { status: 503 });
      }),
    );
    return;
  }

  // Network-first for navigations; fall back to cached shell offline
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (
          (await cache.match(req)) ??
          (await cache.match("/")) ??
          new Response("離線中（offline）", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }
});
