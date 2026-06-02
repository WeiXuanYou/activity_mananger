"use client";
/**
 * Per-invite edit controls for UNUSED codes: change the default role and
 * revoke (delete) the code. Used codes render nothing (immutable).
 *
 * The role list excludes Admin for non-admins — the server action also
 * re-gates, so this is just UI hygiene (the prop says whether to offer it).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInviteRoleAction, deleteInviteAction } from "@/modules/permissions/admin";
import type { Role } from "@/modules/auth";

export function InviteEditControls({
  code,
  currentRole,
  canGrantAdmin = false,
}: {
  code: string;
  currentRole: Role;
  canGrantAdmin?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(currentRole);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const roles: Role[] = canGrantAdmin
    ? ["Guest", "Member", "Editor", "Admin"]
    : ["Guest", "Member", "Editor"];

  const changeRole = (next: Role) => {
    setRole(next);
    setError(null);
    startTransition(async () => {
      try {
        const r = await setInviteRoleAction(code, next);
        if (r.error) { setError(r.error); setRole(currentRole); }
        else router.refresh();
      } catch {
        // requirePermission throws on a denied gate — roll back the
        // optimistic select and show a friendly message.
        setError("沒有權限做這個變更");
        setRole(currentRole);
      }
    });
  };

  const revoke = () => {
    if (!window.confirm(`撤銷邀請碼 ${code}？撤銷後這組碼就無法使用了。`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await deleteInviteAction(code);
        if (r.error) setError(r.error);
        else router.refresh();
      } catch {
        setError("沒有權限撤銷這組邀請碼");
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => changeRole(e.target.value as Role)}
        title="變更這組邀請碼的預設角色"
        className="text-xs px-2 py-1 rounded-soft border border-sand bg-white text-ink/70 disabled:opacity-50"
      >
        {roles.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={revoke}
        disabled={pending}
        title="撤銷（刪除）這組未使用的邀請碼"
        className="text-xs px-2 py-1 rounded-soft bg-white border border-sand text-terracotta-dark hover:bg-terracotta-soft/40 disabled:opacity-50"
      >
        撤銷
      </button>
      {error && <span className="text-[10px] text-terracotta-dark">⚠ {error}</span>}
    </span>
  );
}
