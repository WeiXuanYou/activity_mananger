/**
 * Activity → iCalendar (.ics) export.
 *
 * GET /api/activity/<id>/ics → downloads a standards-compliant VEVENT the
 * user can import into Apple / Google / Outlook calendars (which then give
 * them native reminders, far more reliable than in-app notifications).
 *
 * Auth: requires a signed-in user (same session check as the app). Hidden
 * activities still export for someone with the direct link, matching the
 * detail-page behaviour.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth";

/** Escape per RFC 5545 §3.3.11 — backslash, comma, semicolon, newlines. */
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Format a Date as a UTC iCal timestamp: YYYYMMDDTHHMMSSZ. */
function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Fold lines to <=75 octets per RFC 5545 §3.1 (CRLF + leading space). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const activity = await db.activity.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, location: true,
      startsAt: true, endsAt: true, createdAt: true,
    },
  });
  if (!activity) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const start = activity.startsAt;
  // Default duration: 2 hours when no explicit end.
  const end = activity.endsAt ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Together 相聚//Activity//ZH-TW",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:activity-${activity.id}@together`,
    `DTSTAMP:${toIcsUtc(activity.createdAt)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(activity.title)}`,
    activity.description ? `DESCRIPTION:${escapeIcsText(activity.description)}` : "",
    activity.location ? `LOCATION:${escapeIcsText(activity.location)}` : "",
    // A 1-day-before + 2-hour-before alarm so the calendar nudges them.
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`明天有「${activity.title}」`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const body = lines.map(foldLine).join("\r\n") + "\r\n";

  // Sanitise the title into an ASCII-safe filename; keep a fallback.
  const safeName = activity.title.replace(/[^\w一-鿿-]+/g, "_").slice(0, 40) || "activity";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.ics"; filename*=UTF-8''${encodeURIComponent(safeName)}.ics`,
      "Cache-Control": "no-store",
    },
  });
}
