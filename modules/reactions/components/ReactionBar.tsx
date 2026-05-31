"use client";
/**
 * Reaction bar — a trigger button that shows the viewer's current reaction
 * (or a neutral 👍), a hover/tap popover to pick a kind, and a compact
 * summary of who-reacted-with-what counts.
 *
 * Optimistic: clicking updates local state immediately, then fires the
 * server action which persists + revalidates.
 */
import { useState, useTransition } from "react";
import { setReactionAction } from "../actions";
import {
  REACTION_KINDS,
  REACTION_ORDER,
  type ReactionKind,
  type ReactionParentType,
  type ReactionSummary,
} from "../types";

export function ReactionBar({
  parentType,
  parentId,
  summary,
  revalidate,
}: {
  parentType: ReactionParentType;
  parentId: string;
  summary: ReactionSummary;
  revalidate?: string;
}) {
  const [counts, setCounts] = useState(summary.counts);
  const [mine, setMine] = useState<ReactionKind | null>(summary.mine);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  const choose = (kind: ReactionKind) => {
    setOpen(false);
    // Optimistic local update mirroring the server's one-per-user rule.
    setCounts((cur) => {
      const next = { ...cur };
      if (mine) next[mine] = Math.max(0, (next[mine] ?? 1) - 1);
      if (mine === kind) {
        // toggled off
      } else {
        next[kind] = (next[kind] ?? 0) + 1;
      }
      // prune zeros
      for (const k of Object.keys(next) as ReactionKind[]) if (!next[k]) delete next[k];
      return next;
    });
    setMine((cur) => (cur === kind ? null : kind));
    startTransition(() => setReactionAction({ parentType, parentId, kind, revalidate }));
  };

  // Kinds present, most-used first, for the little summary chips.
  const present = (Object.keys(counts) as ReactionKind[])
    .filter((k) => (counts[k] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

  const mineMeta = mine ? REACTION_KINDS[mine] : null;

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Trigger */}
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => (mine ? choose(mine) : setOpen((o) => !o))}
          className={`flex items-center gap-1.5 transition ${
            mine ? "text-terracotta font-medium" : "text-ink/60 hover:text-terracotta"
          }`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <span>{mineMeta ? mineMeta.emoji : "👍"}</span>
          <span className="text-sm">{mineMeta ? mineMeta.label : "反應"}</span>
        </button>

        {/* Popover picker */}
        {open && (
          <div className="absolute bottom-full left-0 mb-1 z-20 flex items-center gap-0.5 bg-white border border-sand rounded-full shadow-soft px-1.5 py-1">
            {REACTION_ORDER.map((k) => {
              const meta = REACTION_KINDS[k];
              return (
                <button
                  key={k}
                  type="button"
                  title={meta.label}
                  onClick={() => choose(k)}
                  className={`w-8 h-8 rounded-full text-lg leading-none transition hover:scale-125 hover:bg-cream/60 ${
                    mine === k ? "bg-terracotta-soft/50" : ""
                  }`}
                >
                  {meta.emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {total > 0 && (
        <span className="flex items-center gap-1 text-sm text-ink/55">
          <span className="flex -space-x-1">
            {present.slice(0, 3).map((k) => (
              <span key={k} className="leading-none">{REACTION_KINDS[k].emoji}</span>
            ))}
          </span>
          <span className="tabular-nums">{total}</span>
        </span>
      )}
    </div>
  );
}
