"use client";
import { useTransition } from "react";
import { setUserRoleAction } from "@/modules/permissions/admin";
import type { Role } from "@/modules/auth";

const ROLES: Role[] = ["Guest", "Member", "Editor", "Admin"];

export function RoleSelect({ userId, current }: { userId: string; current: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const role = e.target.value as Role;
        if (role !== current) startTransition(() => setUserRoleAction(userId, role));
      }}
      className="text-sm px-2 py-1.5 rounded-soft border border-sand bg-cream/30 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
