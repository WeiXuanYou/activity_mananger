/**
 * Email-client-safe HTML layout for transactional mails.
 *
 * Why table-based, not `<div max-width>`:
 *   - Outlook (desktop) renders mail through Word, which IGNORES
 *     `max-width` on block elements. A `<div max-width: 480px>` ends
 *     up full-bleed at 100% column width — looks broken on every
 *     corporate inbox.
 *   - Gmail strips `<style>` and `<head>` tags entirely in some clients
 *     (Gmail mobile, third-party iOS apps), so all styling has to be
 *     inline on the elements that use it.
 *   - The table+container pattern below is the
 *     widely-tested baseline that renders identically on Gmail web,
 *     Gmail mobile, Apple Mail, iOS Mail, Outlook 365 (web + desktop),
 *     Outlook for Mac, and Yahoo.
 *
 * Also includes:
 *   - `<!DOCTYPE html>` + minimal `<html><head>` so clients with
 *     strict MIME sniffing don't render it as plain text.
 *   - `meta charset` (UTF-8) so CJK characters render without
 *     mojibake on legacy clients.
 *   - A "preheader" (zero-height hidden text) that becomes the
 *     preview line in Gmail / iOS Mail inbox lists — without it the
 *     preview spills from the first visible body line, which often
 *     leaks raw CSS or a stray "嗨，".
 */

export type EmailLayoutOptions = {
  /** Mail subject / page title (rendered as h2). */
  title: string;
  /** Short text shown as the inbox-list preview line. ~80 chars. */
  preheader: string;
  /** Inner HTML for the body. Author-controlled. */
  body: string;
};

/** Wrap a body fragment in a cross-client-tested email shell. */
export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const { title, preheader, body } = opts;
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:#FAF5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif; color:#2C2825;">
  <!-- Preheader: shown in inbox preview, hidden in body -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <!-- Outer 100% table (Outlook/centering) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF5EE;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Container (fixed-width on desktop, fluid on mobile) -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%; background:#FFFFFF; border:1px solid #E8DDD0; border-radius:12px;">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <div style="font-family: 'Noto Serif TC', Georgia, serif; font-size:22px; color:#C75B3A; font-weight:600; letter-spacing:0.5px;">
                相聚 · Together
              </div>
              <div style="height:1px; background:#E8DDD0; margin:14px 0 18px 0; line-height:1px; font-size:1px;">&nbsp;</div>
              <h2 style="margin:0 0 16px 0; font-size:18px; color:#2C2825; font-weight:600; line-height:1.4;">
                ${escapeHtml(title)}
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px 28px; font-size:15px; line-height:1.65; color:#2C2825;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <div style="height:1px; background:#E8DDD0; margin:0 0 14px 0; line-height:1px; font-size:1px;">&nbsp;</div>
              <div style="font-size:12px; color:#9B928A; line-height:1.5;">
                這封信由「相聚 Together」自動寄出 · 給家人朋友的私密小社群
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Big call-to-action button. Uses VML for Outlook bulletproof rendering;
 * Outlook ignores the surrounding `<a>` styling otherwise and the button
 * appears as plain blue underlined text.
 */
export function renderButton(href: string, label: string): string {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto;">
    <tr>
      <td align="center" bgcolor="#C75B3A" style="border-radius:8px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:44px; v-text-anchor:middle; width:240px;" arcsize="18%" stroke="f" fillcolor="#C75B3A">
          <w:anchorlock/>
          <center style="color:#ffffff; font-family:-apple-system,sans-serif; font-size:15px; font-weight:600;">${l}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${h}" style="display:inline-block; padding:13px 28px; font-size:15px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px; background:#C75B3A; mso-hide:all;">
          ${l}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
