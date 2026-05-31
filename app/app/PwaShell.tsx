"use client";
/**
 * Two responsibilities, kept tiny:
 *   1. Register the service worker at /sw.js after first paint.
 *   2. Surface an "install to home screen" CTA when the browser fires
 *      `beforeinstallprompt` (Chrome / Edge / Samsung Internet). iOS
 *      Safari doesn't fire it — for iOS, the Settings menu has an
 *      "add to home screen" hint we render unconditionally on touch
 *      devices once.
 *
 * No-op in development (SW registration is skipped) so the dev server's
 * HMR isn't poisoned by a stale cache.
 */
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "together_pwa_dismissed";

export function PwaShell() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Register the SW, and ALWAYS check for an updated sw.js on load. When a
    // new SW takes control (e.g. the deploy-safe one that stops caching app
    // code), reload once so the page runs against fresh, non-stale assets.
    // This is what heals browsers stuck on a previous aggressive SW that
    // was serving stale JS and breaking all interactivity after a deploy.
    let reloaded = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {
        /* unsupported / file:// — ignore quietly */
      });

    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      // User dismissed before? Don't pester them in this tab.
      if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!deferred || installed) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 md:inset-x-auto md:right-4 md:bottom-4 md:w-80 z-40 rounded-soft bg-white shadow-soft border border-sand p-3 flex items-center gap-3">
      <div className="text-2xl shrink-0">📱</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink">把相聚加到主畫面</div>
        <div className="text-xs text-ink/55 mt-0.5 leading-snug">下次直接點 icon，免開瀏覽器</div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            if (choice.outcome === "accepted") setInstalled(true);
            setDeferred(null);
          }}
          className="px-3 py-1 rounded-soft bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark"
        >
          安裝
        </button>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(DISMISSED_KEY, "1");
            setDeferred(null);
          }}
          className="px-3 py-1 rounded-soft text-xs text-ink/55 hover:bg-cream"
        >
          晚點
        </button>
      </div>
    </div>
  );
}
