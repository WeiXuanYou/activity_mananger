"use client";
/**
 * Admin-side toggle: control whether ONE member may send invite codes.
 *
 * Members can invite by DEFAULT now. This toggle writes/clears a per-user
 * `invite.create:deny` override (via setMemberInviteAllowedAction) so an
 * admin can turn invites off for a specific person and back on anytime.
 *
 * Only shown for Guest / Member rows — Editor/Admin always can invite.
 */
import { useState, useTransition } from "react";
import { setMemberInviteAllowedAction } from "@/modules/permissions/actions";

export function InviteGrantToggle({
  userId,
  allowed,
}: {
  userId: string;
  /** Current effective state: is this member allowed to invite? */
  allowed: boolean;
}) {
  const [on, setOn] = useState(allowed);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next); // optimistic
    startTransition(async () => {
      try {
        await setMemberInviteAllowedAction({ userId, allowed: next });
      } catch {
        setOn(!next); // roll back on error
      }
    });
  };

  return (
    <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={on}
        className={`w-8 h-4 rounded-full transition relative shrink-0 ${
          on ? "bg-terracotta" : "bg-sand"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
            on ? "left-[14px]" : "left-0.5"
          }`}
        />
      </button>
      <span className={on ? "text-terracotta-dark font-medium" : "text-ink/55"}>
        可發邀請
      </span>
    </label>
  );
}
