"use client";
/**
 * Admin-side toggle: grant or revoke `invite.create` for a specific
 * user. Idempotent on both sides — the underlying server actions are
 * safe to call repeatedly.
 *
 * Visible only for Guest / Member users (Editor/Admin already have the
 * permission via their role).
 */
import { useState, useTransition } from "react";
import { grantPermissionAction, revokePermissionAction } from "@/modules/permissions/actions";

export function InviteGrantToggle({
  userId,
  granted,
}: {
  userId: string;
  granted: boolean;
}) {
  const [on, setOn] = useState(granted);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next); // optimistic
    startTransition(async () => {
      try {
        if (next) {
          await grantPermissionAction({ userId, permissionKey: "invite.create" });
        } else {
          await revokePermissionAction({ userId, permissionKey: "invite.create" });
        }
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
