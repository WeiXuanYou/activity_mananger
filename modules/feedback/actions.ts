"use server";
/**
 * Feedback server actions.
 *
 *   - submitFeedbackAction  → any signed-in user (the "聯絡管理員" form)
 *   - setFeedbackStatusAction → admins only (mark OPEN / RESOLVED)
 *
 * Submitting also drops an in-app notification to every admin so they
 * notice new messages without polling the inbox.
 */
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth";
import { requirePermission } from "@/modules/permissions";
import { notify } from "@/modules/notifications";
import type { FeedbackKind } from "./types";

export type SubmitFeedbackState = { error?: string; ok?: boolean };

const KINDS: FeedbackKind[] = ["BUG", "IDEA", "QUESTION", "OTHER"];

export async function submitFeedbackAction(
  _prev: SubmitFeedbackState | undefined,
  formData: FormData,
): Promise<SubmitFeedbackState> {
  const me = await requireCurrentUser();

  const kindRaw = String(formData.get("kind") ?? "OTHER");
  const kind: FeedbackKind = KINDS.includes(kindRaw as FeedbackKind) ? (kindRaw as FeedbackKind) : "OTHER";
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!body) return { error: "請寫下你的訊息內容" };
  if (body.length > 4000) return { error: "訊息太長了（上限 4000 字）" };

  await db.feedback.create({
    data: {
      authorId: me.id,
      kind,
      subject: subject || null,
      body,
      contact: contact || null,
    },
  });

  // Notify every admin in the background — never block submission on it.
  void (async () => {
    try {
      const admins = await db.user.findMany({
        where: { role: { name: "Admin" } },
        select: { id: true },
      });
      for (const a of admins) {
        if (a.id === me.id) continue;
        await notify({
          userId: a.id,
          kind: "feedback.received",
          title: "📨 有新的意見回饋",
          body: `${me.name}：${subject || body.slice(0, 50)}${(!subject && body.length > 50) ? "…" : ""}`,
          link: "/app/admin/feedback",
        });
      }
    } catch {
      // notification failure must never break feedback submission
    }
  })();

  revalidatePath("/app/feedback");
  revalidatePath("/app/admin/feedback");
  return { ok: true };
}

/** Admin-only: flip a feedback message between OPEN and RESOLVED. */
export async function setFeedbackStatusAction(id: string, resolved: boolean): Promise<void> {
  await requirePermission("admin.approve");
  const me = await requireCurrentUser();
  await db.feedback.update({
    where: { id },
    data: {
      status: resolved ? "RESOLVED" : "OPEN",
      resolvedById: resolved ? me.id : null,
      resolvedAt: resolved ? new Date() : null,
    },
  });
  revalidatePath("/app/admin/feedback");
}

/** Admin-only: permanently delete a feedback message. */
export async function deleteFeedbackAction(id: string): Promise<void> {
  await requirePermission("admin.approve");
  await db.feedback.delete({ where: { id } });
  revalidatePath("/app/admin/feedback");
}
