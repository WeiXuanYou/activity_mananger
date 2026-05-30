"use client";
import { useTransition } from "react";
import { castVoteAction } from "@/modules/core/polls/actions";
import { AvatarStack } from "@/modules/core/members";
import type { Member } from "@/modules/core/members";
import type { PollOption } from "@/modules/core/polls";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

function fmtSchedule(label: string): string {
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${WEEKDAYS[d.getDay()]} · ${hh}:${mi}`;
}

export function VoteButton({
  pollId,
  option,
  multiSelect,
  selected,
  pct,
  voters,
  anonymous,
  isSchedule = false,
  isTop = false,
}: {
  pollId: string;
  option: PollOption;
  multiSelect: boolean;
  selected: boolean;
  pct: number;
  voters: Member[];
  anonymous: boolean;
  isSchedule?: boolean;
  isTop?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      await castVoteAction(pollId, option.id);
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`w-full text-left rounded-soft border p-4 transition disabled:opacity-50 ${
        selected
          ? "bg-terracotta-soft/30 border-terracotta shadow-card"
          : "bg-cream/30 border-sand hover:border-terracotta/50 hover:bg-cream/50"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-5 h-5 ${multiSelect ? "rounded" : "rounded-full"} border-2 flex items-center justify-center ${
            selected ? "border-terracotta bg-terracotta" : "border-sand bg-white"
          }`}
        >
          {selected && (
            multiSelect
              ? <span className="text-white text-xs leading-none">✓</span>
              : <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>
        <span className="font-medium text-ink flex-1 flex items-center gap-1.5">
          {isTop && <span title="目前最多人方便">👑</span>}
          {isSchedule ? fmtSchedule(option.label) : option.label}
          {option.addedById && (
            <span className="ml-1 text-[10px] text-sage-dark bg-sage/10 px-1 rounded">後加</span>
          )}
        </span>
        <span className="text-sm text-ink/60 whitespace-nowrap">{option.votes} 票 · {pct}%</span>
      </div>
      <div className="h-2.5 bg-white rounded-full overflow-hidden mb-2">
        <div
          className={
            selected
              ? "h-full bg-gradient-to-r from-terracotta to-terracotta-dark"
              : "h-full bg-gradient-to-r from-terracotta-soft to-terracotta/60"
          }
          style={{ width: `${pct}%` }}
        />
      </div>
      {!anonymous && voters.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <AvatarStack memberIds={voters.map((v) => v.id)} members={voters} max={5} />
        </div>
      )}
      {anonymous && voters.length > 0 && (
        <div className="text-xs text-ink/40">{voters.length} 位投了這個</div>
      )}
    </button>
  );
}
