"use client";
/**
 * Push-notification opt-in toggle. Lives on the account page.
 *
 * Flow: ask the browser for Notification permission → subscribe via the
 * service worker's PushManager using the server's VAPID public key → send
 * the subscription to the server to persist. Disabling unsubscribes locally
 * and tells the server to forget the row.
 *
 * Gracefully degrades: if push isn't configured (no NEXT_PUBLIC_VAPID
 * key), or the browser lacks support, it explains instead of erroring.
 */
import { useEffect, useState } from "react";
import { savePushSubscriptionAction, deletePushSubscriptionAction } from "@/modules/push/actions";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convert a base64url VAPID key to the Uint8Array the PushManager wants. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on" | "working";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!VAPID_PUBLIC) { setState("unconfigured"); return; }
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") { setState("denied"); return; }
    // Check whether we already have a subscription.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const enable = async () => {
    setError(null);
    setState("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const r = await savePushSubscriptionAction({
        endpoint: json.endpoint ?? "",
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      setState(r.ok ? "on" : "off");
      if (!r.ok) setError("訂閱失敗，請再試一次");
    } catch (e) {
      setError(e instanceof Error ? e.message : "訂閱失敗");
      setState("off");
    }
  };

  const disable = async () => {
    setError(null);
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
      setError("取消訂閱失敗");
    }
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
      <h2 className="serif text-lg text-ink mb-1 flex items-center gap-2">🔔 推播通知</h2>
      <p className="text-sm text-ink/60 mb-3">
        開啟後，有人 @你、留言、或活動快開始時，手機鎖定畫面也會收到通知。
      </p>

      {state === "loading" && <p className="text-sm text-ink/45">檢查中…</p>}

      {state === "unconfigured" && (
        <p className="text-sm text-ink/55 bg-cream/50 rounded-soft px-3 py-2">
          伺服器尚未設定推播金鑰（VAPID）。設定後即可啟用——詳見 README。
        </p>
      )}

      {state === "unsupported" && (
        <p className="text-sm text-ink/55 bg-cream/50 rounded-soft px-3 py-2">
          這個瀏覽器不支援推播通知。iPhone 請先「加入主畫面」後從該圖示開啟。
        </p>
      )}

      {state === "denied" && (
        <p className="text-sm text-terracotta-dark bg-terracotta-soft/40 rounded-soft px-3 py-2">
          通知權限已被封鎖。請到瀏覽器設定把本網站的通知改回「允許」。
        </p>
      )}

      {(state === "off" || state === "working") && (
        <button
          type="button"
          onClick={enable}
          disabled={state === "working"}
          className="px-4 py-2 rounded-soft bg-terracotta text-white font-medium text-sm shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {state === "working" ? "處理中…" : "開啟推播通知"}
        </button>
      )}

      {state === "on" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-sage-dark">✓ 已開啟（這個裝置）</span>
          <button
            type="button"
            onClick={disable}
            className="text-sm px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40"
          >
            關閉
          </button>
        </div>
      )}

      {error && <p className="text-xs text-terracotta-dark mt-2">⚠ {error}</p>}
    </div>
  );
}
