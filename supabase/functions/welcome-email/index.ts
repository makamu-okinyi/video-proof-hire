/**
 * Edge function: Send welcome email on new user signup
 * Called via a database webhook or from the frontend after signup.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeRequest {
  userId: string;
  username?: string;
  email?: string;
}

function buildWelcomeHtml(recipientName: string): string {
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
            <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">WELCOME TO STARTUP GARAGE</p>
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
              You're now part of Startup Garage by Donjo Africa.<br/>
              That means a real person did a happy dance when you signed up.<br/><br/>
              Whether you're here to showcase your talent, find opportunities, or build the next big thing — we're glad you're here.
            </p>
          </td>
        </tr>

        <tr><td style="height:28px;"></td></tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1a1a1a;padding:12px 32px;border-radius:2px;">
                  <a href="https://donjo.lovable.app/feed" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Get Started</a>
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
            <p style="margin:0;font-size:10px;color:#aaa;">We appreciate your support.</p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
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
    const errBody = await res.text();
    console.error("Resend error:", res.status, errBody);
  } else {
    console.log("Welcome email sent to", to);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WelcomeRequest = await req.json();
    const { userId, username, email } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user email from auth
    let recipientEmail = email;
    let recipientName = username || "there";

    if (!recipientEmail) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      recipientEmail = userData?.user?.email;
      recipientName = userData?.user?.user_metadata?.username || recipientEmail?.split("@")[0] || "there";
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await sendEmail(
      recipientEmail,
      "Welcome to Startup Garage 🚀",
      buildWelcomeHtml(recipientName)
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("welcome-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
