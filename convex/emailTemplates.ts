// Plain helper module (no query/mutation/action exports) — ported verbatim from the
// retired Supabase edge functions so email copy/design doesn't drift during the Convex migration.

export function buildJobAlertHtml(params: {
  recipientName: string;
  jobTitle: string;
  companyName: string;
  jobType: string;
  location?: string;
}): string {
  const { recipientName, jobTitle, companyName, jobType, location } = params;
  const firstName = recipientName.split(" ")[0] || recipientName;
  const locationLine = location ? `📍 ${location}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Georgia','Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <tr><td style="height:48px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:42px;font-style:italic;font-weight:400;color:#1a1a1a;font-family:'Georgia','Times New Roman',serif;letter-spacing:-1px;">hello.</p></td></tr>
        <tr><td style="height:24px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">NEW OPPORTUNITY</p></td></tr>
        <tr><td style="height:16px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><div style="width:50px;height:1px;background:#1a1a1a;"></div></td></tr>
        <tr><td style="height:24px;"></td></tr>
        <tr>
          <td align="center" style="padding:0 48px;">
            <p style="margin:0;font-size:14px;line-height:1.8;color:#555;text-align:center;">
              Hi ${firstName},<br/><br/>
              A new position has been posted that might interest you.<br/><br/>
              <strong style="color:#1a1a1a;font-size:16px;">${jobTitle}</strong><br/>
              ${companyName} · ${jobType}${locationLine ? `<br/>${locationLine}` : ""}
            </p>
          </td>
        </tr>
        <tr><td style="height:28px;"></td></tr>
        <tr>
          <td align="center" style="padding:0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:#1a1a1a;padding:12px 32px;border-radius:2px;"><a href="https://hr.donjoafrica.com/jobs" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Jobs</a></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:28px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><div style="width:50px;height:1px;background:#1a1a1a;"></div></td></tr>
        <tr><td style="height:24px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:13px;color:#1a1a1a;letter-spacing:0.5px;">donjoafrica.com</p></td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:11px;color:#999;">Startup Garage by Donjo Africa</p></td></tr>
        <tr><td style="height:40px;"></td></tr>
      </table>
      <table width="560" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:20px 40px 0;"><p style="margin:0;font-size:10px;color:#aaa;">This is an automated notification. Please do not reply to this email.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildStatusChangeEmailHtml(params: {
  status: "shortlisted" | "rejected";
  type: "job_status" | "venture_status";
  title: string;
  message: string;
  recipientName: string;
}): string {
  const { status, type, title, message, recipientName } = params;
  const isApproved = status === "shortlisted";
  const verdictLabel = isApproved ? "Shortlisted ✓" : "Not Selected";
  const verdictColor = isApproved ? "#2d6a4f" : "#9b2226";
  const firstName = recipientName.split(" ")[0] || recipientName;

  const followUp = isApproved
    ? `We'll be in touch shortly with next steps. Please check your messages on the platform for further details.`
    : `We appreciate your time and effort. We encourage you to continue refining your ${type === "venture_status" ? "pitch" : "application"} and apply again in the future.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Georgia','Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:0;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <tr><td style="height:48px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:42px;font-style:italic;font-weight:400;color:#1a1a1a;font-family:'Georgia','Times New Roman',serif;letter-spacing:-1px;">hello.</p></td></tr>
        <tr><td style="height:24px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">${title}</p></td></tr>
        <tr><td style="height:16px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><div style="width:50px;height:1px;background:#1a1a1a;"></div></td></tr>
        <tr><td style="height:20px;"></td></tr>
        <tr>
          <td align="center" style="padding:0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr><td style="background:${verdictColor};color:#ffffff;padding:8px 24px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;">${verdictLabel}</td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:24px;"></td></tr>
        <tr>
          <td align="center" style="padding:0 48px;">
            <p style="margin:0;font-size:14px;line-height:1.8;color:#555;text-align:center;">
              Hi ${firstName},<br/><br/>
              ${message}<br/><br/>
              ${followUp}
            </p>
          </td>
        </tr>
        <tr><td style="height:28px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><div style="width:50px;height:1px;background:#1a1a1a;"></div></td></tr>
        <tr><td style="height:24px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:13px;color:#1a1a1a;letter-spacing:0.5px;">donjoafrica.com</p></td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td align="center" style="padding:0 40px;"><p style="margin:0;font-size:11px;color:#999;">Startup Garage by Donjo Africa</p></td></tr>
        <tr><td style="height:40px;"></td></tr>
      </table>
      <table width="560" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:20px 40px 0;"><p style="margin:0;font-size:10px;color:#aaa;">This is an automated notification. Please do not reply to this email.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

export function buildGenericNotificationHtml(params: {
  type: "new_message" | "application_status";
  recipientName: string;
  senderName?: string;
  messagePreview?: string;
  jobTitle?: string;
  companyName?: string;
  status?: string;
}): { subject: string; html: string } {
  const recipientName = escapeHtml(params.recipientName);
  const safeSenderName = escapeHtml(params.senderName || "Someone");
  const safeMessagePreview = escapeHtml(params.messagePreview || "...");
  const safeJobTitle = escapeHtml(params.jobTitle || "the position");
  const safeCompanyName = escapeHtml(params.companyName || "the company");
  const safeStatus = escapeHtml(params.status || "updated");

  if (params.type === "new_message") {
    return {
      subject: `New message from ${safeSenderName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B6B; margin-bottom: 20px;">New Message</h1>
          <p style="color: #333; font-size: 16px;">Hi ${recipientName},</p>
          <p style="color: #333; font-size: 16px;">You have a new message from <strong>${safeSenderName}</strong>:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-style: italic; margin: 0;">"${safeMessagePreview}"</p>
          </div>
          <p style="color: #666; font-size: 14px;">Log in to your account to reply.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">— Startup Garage</p>
        </div>
      `,
    };
  }

  const statusText =
    safeStatus === "shortlisted" ? "been shortlisted" : safeStatus === "rejected" ? "been reviewed" : "been updated";
  return {
    subject: `Your job application has ${statusText}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF6B6B; margin-bottom: 20px;">Application Update</h1>
        <p style="color: #333; font-size: 16px;">Hi ${recipientName},</p>
        <p style="color: #333; font-size: 16px;">Your application for <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong> has ${statusText}.</p>
        ${safeStatus === "shortlisted" ? `
          <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0;">🎉 Congratulations! The employer may reach out to you soon.</p>
          </div>
        ` : ""}
        <p style="color: #666; font-size: 14px;">Log in to your account to view more details.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">— Startup Garage</p>
      </div>
    `,
  };
}

export async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Startup Garage <notifications@startupgarage.donjoafrica.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend error:", res.status, await res.text());
  }
}
