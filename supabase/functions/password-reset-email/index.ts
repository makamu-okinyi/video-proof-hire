/**
 * Edge function: Send a branded password reset email
 * Called when a user requests a password reset.
 * NOTE: This supplements the built-in auth email — call it after supabase.auth.resetPasswordForEmail()
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  email: string;
  resetUrl: string;
}

function buildResetHtml(recipientName: string, resetUrl: string): string {
  const firstName = recipientName.split(" ")[0] || recipientName;

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

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:42px;font-style:italic;font-weight:400;color:#1a1a1a;font-family:'Georgia','Times New Roman',serif;letter-spacing:-1px;">hello.</p>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">PASSWORD RESET</p>
          </td>
        </tr>

        <tr><td style="height:16px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <div style="width:50px;height:1px;background:#1a1a1a;"></div>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 48px;">
            <p style="margin:0;font-size:14px;line-height:1.8;color:#555;text-align:center;">
              Hi ${firstName},<br/><br/>
              We received a request to reset your password. Click the button below to choose a new one.<br/><br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <tr><td style="height:28px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a1a;padding:12px 32px;border-radius:2px;">
                  <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Reset Password</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:28px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <div style="width:50px;height:1px;background:#1a1a1a;"></div>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:13px;color:#1a1a1a;letter-spacing:0.5px;">donjo.lovable.app</p>
          </td>
        </tr>

        <tr><td style="height:8px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:11px;color:#999;">Startup Garage by Donjo Africa</p>
          </td>
        </tr>

        <tr><td style="height:40px;"></td></tr>

      </table>

      <table width="560" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:20px 40px 0;">
            <p style="margin:0;font-size:10px;color:#aaa;">This link expires in 1 hour. Do not share it with anyone.</p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ResetRequest = await req.json();
    const { email, resetUrl } = body;

    if (!email || !resetUrl) {
      return new Response(JSON.stringify({ error: "Missing email or resetUrl" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const recipientName = email.split("@")[0] || "there";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Startup Garage <notifications@startupgarage.donjoafrica.com>",
        to: [email],
        subject: "Reset your password — Startup Garage",
        html: buildResetHtml(recipientName, resetUrl),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", res.status, errBody);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Password reset email sent to", email);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("password-reset-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
