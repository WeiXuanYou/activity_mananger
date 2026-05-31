// Service worker for PWA installability + Web Push.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

// Web Push: show the notification the server sent.
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
    // Stash the link so the click handler can open it.
    data: { link: payload.link || "/app/feed" },
    // Coalesce duplicate notifications about the same thing.
    tag: payload.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking a push notification focuses an existing tab (navigating it to
// the link) or opens a new one.
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
