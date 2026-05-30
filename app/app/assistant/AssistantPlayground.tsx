"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  runClassifyAction,
  runSummarizeAction,
  runDraftPollAction,
  runDraftActivityAction,
  type AssistantResult,
} from "@/modules/ai-assistant/actions";

type Mode = {
  key: AssistantResult["kind"];
  label: string;
  emoji: string;
  placeholder: string;
  run: (input: string) => Promise<AssistantResult>;
};

/**
 * Build the create-page URL with a base64url-encoded payload, so any
 * special chars (line breaks, quotes, slashes, CJK) round-trip safely.
 * Browser-only encoder: UTF-8 → bytes → base64 → URL-safe.
 */
function buildPrefillHref(path: "/app/polls/new" | "/app/activities/new", payload: object): string {
  const utf8 = new TextEncoder().encode(JSON.stringify(payload));
  let bin = "";
  for (const byte of utf8) bin += String.fromCharCode(byte);
  const b64url = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${path}?prefill=${b64url}`;
}

const MODES: Mode[] = [
  {
    key: "draft-poll",
    label: "起一個投票",
    emoji: "📊",
    placeholder: "例如：下次家庭聚餐吃什麼？",
    run: runDraftPollAction,
  },
  {
    key: "draft-activity",
    label: "草擬活動",
    emoji: "🍖",
    placeholder: "例如：中秋節在外公家烤肉",
    run: runDraftActivityAction,
  },
  {
    key: "classify",
    label: "建議分類",
    emoji: "🏷",
    placeholder: "貼一段文章內容，我來建議分類...",
    run: runClassifyAction,
  },
  {
    key: "summarize",
    label: "摘要長文",
    emoji: "📜",
    placeholder: "貼一段長內容，我幫你濃縮成一兩句...",
    run: runSummarizeAction,
  },
];

export function AssistantPlayground({ live, providerLabel }: { live: boolean; providerLabel: string }) {
  const [modeKey, setModeKey] = useState<Mode["key"]>("draft-poll");
  const [input, setInput] = useState("");
  // Keep the full result so we can render kind-specific CTAs ("建立此投票")
  // not just the plain-text preview.
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [pending, startTransition] = useTransition();

  const mode = MODES.find((m) => m.key === modeKey)!;

  const run = () => {
    if (!input.trim()) return;
    setResult(null);
    startTransition(async () => {
      const r = await mode.run(input);
      setResult(r);
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setModeKey(m.key); setResult(null); }}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              modeKey === m.key
                ? "bg-sage text-white shadow-card"
                : "bg-cream/50 text-ink/70 hover:bg-cream"
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode.placeholder}
        rows={4}
        className="w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-sage resize-none"
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={run}
          disabled={pending || !input.trim()}
          className="px-5 py-2.5 rounded-soft bg-sage text-white font-medium shadow-card hover:bg-sage-dark transition disabled:opacity-50"
        >
          {pending ? "思考中..." : `✨ ${mode.label}`}
        </button>
        <span className="text-xs text-ink/40">
          {live ? `由 ${providerLabel} 回應` : "stub 模式"}
        </span>
      </div>

      {result !== null && (
        <div className="mt-4 rounded-soft border border-sage/30 bg-gradient-to-br from-sage-soft/30 to-cream p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-sage-dark font-medium">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sage to-sage-dark text-white flex items-center justify-center text-xs">✨</span>
            AI 回應
          </div>
          <pre className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap font-sans">{result.text}</pre>

          {/* One-click "建立此X" — only when the AI actually drafted something we can persist. */}
          {result.kind === "draft-poll" && result.payload.options.length >= 2 && (
            <div className="mt-4 pt-3 border-t border-sage/20 flex items-center gap-3 flex-wrap">
              <Link
                href={buildPrefillHref("/app/polls/new", result.payload)}
                className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition"
              >
                ✓ 用這份草稿建立投票
              </Link>
              <span className="text-xs text-ink/55">會帶你到投票表單，已預填好可再調整</span>
            </div>
          )}
          {result.kind === "draft-activity" && result.payload.title && (
            <div className="mt-4 pt-3 border-t border-sage/20 flex items-center gap-3 flex-wrap">
              <Link
                href={buildPrefillHref("/app/activities/new", result.payload)}
                className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium shadow-card hover:bg-terracotta-dark transition"
              >
                ✓ 用這份草稿建立活動
              </Link>
              <span className="text-xs text-ink/55">會帶你到活動表單，已預填好可再調整</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
