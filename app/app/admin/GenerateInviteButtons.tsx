"use client";
import { useState, useTransition } from "react";
import { generateInviteCodeAction } from "@/modules/permissions/admin";
import type { Role } from "@/modules/auth";

const ROLES: Role[] = ["Guest", "Member", "Editor"];

export function GenerateInviteButtons() {
  const [pending, startTransition] = useTransition();
  const [justGenerated, setJustGenerated] = useState<string | null>(null);

  const generate = (role: Role) => {
    setJustGenerated(role);
    startTransition(() => generateInviteCodeAction(role));
  };

  return (
    <div>
      <div className="text-xs text-ink/60 font-medium mb-2">產生邀請碼（選擇預設角色）</div>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            disabled={pending}
            onClick={() => generate(r)}
            className="px-4 py-2 rounded-soft bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition disabled:opacity-50"
          >
            + {r}
          </button>
        ))}
      </div>
      {justGenerated && !pending && (
        <p className="text-xs text-sage-dark mt-2">✓ 已產生一組 {justGenerated} 邀請碼，見下方列表最上方</p>
      )}
    </div>
  );
}
