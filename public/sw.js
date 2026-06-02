/* 相聚 Service Worker — minimal + deploy-safe.
 *
 * HARD LESSON: a service worker that caches HTML or JS chunks will, after
 * the next deploy, serve STALE client code against fresh server markup —
 * causing a hydration mismatch that silently kills ALL interactivity
 * (comments, edits, menus, forms). So this SW deliberately does NOT cache
 * any app code. It only:
 *   1. exists so the app is installable as a PWA, and
 *   2. handles Web Push (push + notificationclick).
 *
 * On activate it DELETES every cache a previous SW version created, so a
 * browser that still has the old aggressive SW heals itself on next load.
 */

self.addEventListener("install", () => {
  // Take over as soon as possible so the fix reaches users without a
  // second reload.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Nuke ALL caches — including the old together-static-* / together-img-*
      // that cached HTML/JS and caused the stale-hydration breakage.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// IMPORTANT: no "fetch" handler. Without one, the browser goes straight to
// the network for every request — always-fresh HTML + JS, no stale cache.

// --- Web Push -------------------------------------------------------------
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "相聚", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "相聚 Together";
  const options = {
    body: payload.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { link: payload.link || "/app/feed" },
    tag: payload.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/app/feed";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
