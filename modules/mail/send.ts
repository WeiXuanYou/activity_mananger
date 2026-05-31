/**
 * Tiny email sender — Resend API over `fetch`, with a dev fallback that
 * just logs to stdout.
 *
 * Why Resend over nodemailer?
 *   - One HTTP call, no SMTP socket lifecycle to manage in serverless
 *   - No additional npm dependency (we use the global fetch)
 *   - Free tier covers a family/friends install many times over
 *
 * Env vars:
 *   RESEND_API_KEY  — when set, real delivery via api.resend.com
 *   MAIL_FROM       — defaults to "相聚 Together <onboarding@resend.dev>".
 *                     Operators should set this to a verified domain in
 *                     production; the default works for development.
 *
 * Failure mode is non-fatal by design — auth flows decide "did this
 * request succeed?" purely on token issuance, not delivery success.
 * Bouncing should not lock a user out of password reset.
 */

export type MailMessage = {
  to: string;
  subject: string;
  /** Plain-text body. Always provided so the message is readable in
   *  mail clients that don't render HTML. */
  text: string;
  /** Optional HTML body. We KEEP this simple (no templating engine);
   *  inline styles only, no remote resources. */
  html?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Best-effort send. Returns `{ ok: true }` regardless of whether
 * real delivery happened — the auth layer uses the same generic
 * "if we have an account…" response either way to avoid an email
 * enumeration oracle.
 */
export async function sendEmail(msg: MailMessage): Promise<{ ok: true }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim() || "相聚 Together <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev / unconfigured path — print to server log so operators can
    // copy-paste the recovery link to the user manually.
    console.log("\n📧 [mail:dev-fallback] (set RESEND_API_KEY to send real emails)");
    console.log(`   to:      ${msg.to}`);
    console.log(`   subject: ${msg.subject}`);
    console.log("   --- text ---");
    for (const line of msg.text.split("\n")) console.log(`   ${line}`);
    console.log("");
    return { ok: true };
  }

  try {
    // 5-second cap. Without this, a slow / hanging Resend response keeps
    // the server-action connection alive for Node's ~5-minute socket
    // timeout — a DoS surface for the unauth /forgot endpoint. AbortError
    // is caught below and logged like any other failure.
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("📧 [mail:resend] non-2xx", res.status, body.slice(0, 200));
    }
  } catch (e) {
    // Network blip, DNS failure, or timeout — log loudly but don't
    // bubble up. The user-facing flow already returned the generic
    // "we sent if we have your email" message.
    console.error("📧 [mail:resend] fetch failed:", (e as Error).message);
  }
  return { ok: true };
}
