"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitPermissionRequestAction,
  type RequestState,
} from "@/modules/permissions/actions";
import type { Role } from "@/modules/auth";

export function RequestForm({ currentRole }: { currentRole: Role }) {
  const [state, action] = useActionState<RequestState | undefined, FormData>(
    submitPermissionRequestAction,
    undefined,
  );

  // Only show roles strictly higher than the current
  const order: Role[] = ["Guest", "Member", "Editor", "Admin"];
  const targets = order.slice(order.indexOf(currentRole) + 1);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink/80">目標權限</span>
        <select
          name="requestedRole"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
        >
          {targets.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">申請理由</span>
        <textarea
          name="reason"
          required
          placeholder="想要這個權限的原因（一兩句就好）"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
          rows={3}
        />
      </label>

      {state?.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-xs text-sage-dark bg-sage-soft/40 border border-sage/30 rounded-soft px-3 py-2">
          ✓ 已送出申請，管理員會處理
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <SubmitButton />
        <span className="text-xs text-ink/50">申請紀錄會永久保存（審計用）</span>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
    >
      {pending ? "送出中..." : "送出申請"}
    </button>
  );
}
