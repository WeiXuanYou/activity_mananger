import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/modules/auth";

/**
 * The setup form is rendered inline by the app layout when the user's
 * `setupCompleted` flag is false — so any nav path through /app shows
 * the form, not an empty shell.
 *
 * This page exists for two reasons:
 *   1. Backwards-compatibility for the URL `/app/setup` (used by
 *      redirects from older sessions, links in copy, etc.).
 *   2. A completion-then-redirect path: if a user nav'd here after
 *      completing setup, send them to the feed.
 *
 * The layout's inline-render already handles the not-yet-complete case
 * by replacing children. So this page just needs to redirect when
 * setupCompleted is true.
 */
export default async function SetupPage() {
  const me = await requireCurrentUser();
  if (me.setupCompleted) redirect("/app/feed");
  // Not yet completed → return null. The layout will render the form
  // in our place. Returning null avoids any double-rendering of the
  // SetupForm and avoids the redirect-cache loop we hit when this page
  // tried to do the routing itself.
  return null;
}
