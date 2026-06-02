import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "相聚 · Together",
  description: "給家人與朋友的活動、投票、文章與自訂頁面",
};

/**
 * Without `width=device-width` the browser renders mobile pages at the
 * default 980px width and scales down — Tailwind's `md:` breakpoint
 * never kicks in. Setting this is the difference between a usable
 * mobile layout and a tiny illegible desktop screenshot.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * SERVICE-WORKER KILL SWITCH (runs in <head>, before any other JS).
 *
 * Why inline + head: a stale/aggressive service worker from a previous
 * deploy can serve old JS chunks that don't match the new server HTML,
 * which breaks React hydration → ALL interactivity dies (comments, edits,
 * menus, forms). If the page is that broken, React-based cleanup never
 * runs. This raw script does NOT depend on React/Next: it unregisters
 * every service worker and deletes every cache, then reloads ONCE.
 *
 * Self-limiting: it sets a sessionStorage flag after cleaning so it can
 * never reload-loop. Safe to keep permanently — once there are no SWs and
 * no caches, it's a no-op on every subsequent load.
 */
const SW_KILL_SWITCH = `
(function(){
  try {
    if (!('serviceWorker' in navigator)) return;
    // If the user deliberately enabled push notifications, leave their SW
    // alone (PushToggle sets this flag). The deploy-safe sw.js doesn't
    // cache app code, so it can't cause the stale-hydration problem.
    if (localStorage.getItem('together_push_enabled') === '1') return;
    var KEY='together_sw_cleaned_v2';
    navigator.serviceWorker.getRegistrations().then(function(regs){
      var hadSW = regs && regs.length > 0;
      var jobs = (regs||[]).map(function(r){ return r.unregister(); });
      var cacheJob = (window.caches && caches.keys)
        ? caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
        : Promise.resolve();
      Promise.all([Promise.all(jobs), cacheJob]).then(function(){
        // Only reload if we actually removed an old SW AND haven't already
        // done so this session — prevents any loop.
        if (hadSW && !sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY,'1');
          location.reload();
        }
      }).catch(function(){});
    }).catch(function(){});
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        {/* Must run before React hydrates — see SW_KILL_SWITCH note above. */}
        <script dangerouslySetInnerHTML={{ __html: SW_KILL_SWITCH }} />
      </head>
      <body className="min-h-screen paper-grain">{children}</body>
    </html>
  );
}
