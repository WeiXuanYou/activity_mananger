import type { Suggestion } from "../types";

/**
 * Pure-presentational chip row meant to embed inside composers.
 * No state — page passes onPick to handle the action.
 */
export function AssistantSuggestions({
  suggestions,
  onPick,
}: {
  suggestions: Suggestion[];
  onPick?: (s: Suggestion) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-soft border border-sage/30 bg-gradient-to-br from-sage-soft/30 to-cream p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-sage-dark tracking-wider">✨ AI 助手</span>
        <span className="text-[10px] text-ink/40">stub · 之後接 Anthropic SDK</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick?.(s)}
            title={s.hint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white border border-sand text-ink/75 hover:border-sage hover:text-sage-dark transition"
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
