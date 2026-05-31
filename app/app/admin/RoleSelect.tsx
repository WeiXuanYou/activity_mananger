"use client";
import { useTransition } from "react";
import { setUserRoleAction } from "@/modules/permissions/admin";
import type { Role } from "@/modules/auth";

const ROLES: Role[] = ["Guest", "Member", "Editor", "Admin"];

export function RoleSelect({
  userId,
  current,
  disabled = false,
}: {
  userId: string;
  current: Role;
  /** External lock — used for the bootstrap admin row whose role is
   *  protected at the action layer; we surface the disabled state in
   *  the UI so the operator doesn't try to demote it and get an alert. */
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending || disabled}
      onChange={(e) => {
        const role = e.target.value as Role;
        if (role !== current) startTransition(() => setUserRoleAction(userId, role));
      }}
      title={disabled ? "admin 帳號的角色固定為 Admin" : undefined}
      className="text-sm px-2 py-1.5 rounded-soft border border-sand bg-cream/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
