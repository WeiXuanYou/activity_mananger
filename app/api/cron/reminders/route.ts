/**
 * Cron endpoint for sending activity reminders.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` header. The secret is read
 * from `process.env.CRON_SECRET`. If unset, any caller can invoke — fine
 * for dev / loopback but a misconfiguration in production. We log a
 * warning to stderr in that case but don't refuse, so a freshly-cloned
 * dev setup still works without ceremony.
 *
 * Schedule recommendation: every 15 minutes is plenty. The reminder
 * windows are wide (26h, 2.5h) so missed fires self-heal.
 *
 *   curl https://your-app.example.com/api/cron/reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * Returns JSON with the run summary. 401 if the bearer is wrong.
 */
import { NextResponse } from "next/server";
import { runActivityReminders } from "@/modules/core/reminders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("[cron/reminders] CRON_SECRET not set — endpoint is open to anyone with the URL");
  }

  const result = await runActivityReminders();
  return NextResponse.json({ ok: true, ...result });
}

/** GET works the same way — handy for testing in the browser/curl. */
export const GET = POST;
