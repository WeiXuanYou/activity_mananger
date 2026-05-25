import type { Suggestion } from "../types";

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="bg-white rounded-soft border border-sand/60 shadow-card p-4 hover:border-sage transition">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-soft bg-gradient-to-br from-sage-soft to-cream flex items-center justify-center text-xl shrink-0">
          {suggestion.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink mb-0.5">{suggestion.label}</div>
          <div className="text-xs text-ink/55 leading-relaxed">{suggestion.hint || "—"}</div>
        </div>
      </div>
      <button className="mt-3 w-full text-xs py-1.5 rounded-soft bg-sage-soft/50 text-sage-dark font-medium hover:bg-sage-soft transition">
        試試看 →
      </button>
    </div>
  );
}
