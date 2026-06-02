"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitFeedbackAction, type SubmitFeedbackState } from "@/modules/feedback/actions";
import { FEEDBACK_KINDS, type FeedbackKind } from "@/modules/feedback";
import { useState } from "react";

export function FeedbackForm() {
  const [state, action] = useActionState<SubmitFeedbackState | undefined, FormData>(
    submitFeedbackAction,
    undefined,
  );
  const [kind, setKind] = useState<FeedbackKind>("IDEA");

  if (state?.ok) {
    return (
      <div className="bg-sage-soft/30 rounded-soft border border-sage/30 p-8 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="serif text-lg text-ink mb-1">已送出，謝謝你的回饋！</p>
        <p className="text-sm text-ink/60 mb-4">管理員會看到你的訊息。需要的話我們會透過你的帳號 Email 或留下的聯絡方式回覆。</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm px-4 py-2 rounded-soft bg-white border border-sand text-ink/75 hover:bg-cream/40 transition"
        >
          ＋ 再送一則
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      <div>
        <span className="text-sm font-medium text-ink/80 block mb-2">類型</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FEEDBACK_KINDS) as FeedbackKind[]).map((k) => {
            const meta = FEEDBACK_KINDS[k];
            const sel = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                  sel
                    ? "bg-terracotta text-white border-transparent shadow-card"
                    : "bg-white text-ink/70 border-sand hover:bg-cream/40"
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="kind" value={kind} />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">主旨（可選）</span>
        <input
          name="subject"
          maxLength={120}
          placeholder="一句話描述"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">訊息內容 *</span>
        <textarea
          name="body"
          required
          rows={6}
          placeholder="把你遇到的問題、想法或提問寫在這裡…"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta resize-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">聯絡方式（可選）</span>
        <input
          name="contact"
          maxLength={120}
          placeholder="如果想用帳號 Email 以外的方式收到回覆（LINE / 電話…）"
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
        />
      </label>

      {state?.error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <SubmitButton />
        <span className="text-xs text-ink/40">只有管理員看得到你的訊息</span>
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
      {pending ? "送出中…" : "送出回饋"}
    </button>
  );
}
