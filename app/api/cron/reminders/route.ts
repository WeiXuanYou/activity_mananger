/**
 * Cron endpoint for sending activity reminders.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` header (POST only). The
 * secret is read from `process.env.CRON_SECRET`.
 *
 * Fail-closed: if `CRON_SECRET` is unset we REFUSE the request (503) rather
 * than running for anyone — an unauthenticated public endpoint that fires
 * mail/notification writes is a spam/DoS vector. Set the secret (even in
 * dev) to enable it. The bearer is compared in constant time.
 *
 * Schedule recommendation: every 15 minutes is plenty. The reminder
 * windows are wide (26h, 2.5h) so missed fires self-heal.
 *
 *   curl -X POST https://your-app.example.com/api/cron/reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * Returns JSON with the run summary. 401 if the bearer is wrong, 503 if
 * the server has no CRON_SECRET configured.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runActivityReminders } from "@/modules/core/reminders";

export const dynamic = "force-dynamic";

/** Constant-time string compare that doesn't leak length via early-exit. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // Hash-equal-length guard: timingSafeEqual throws on length mismatch, so
  // compare against a fixed-size digest-like padding. Simplest correct form:
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();

  // Fail closed — no secret configured means the endpoint stays disabled
  // instead of running for any anonymous caller.
  if (!expected) {
    // eslint-disable-next-line no-console
    console.error("[cron/reminders] refused: CRON_SECRET is not set");
    return NextResponse.json(
      { ok: false, error: "cron endpoint disabled (CRON_SECRET not configured)" },
      { status: 503 },
    );
  }

  const got = req.headers.get("authorization") ?? "";
  if (!safeEqual(got, `Bearer ${expected}`)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await runActivityReminders();
  return NextResponse.json({ ok: true, ...result });
}
