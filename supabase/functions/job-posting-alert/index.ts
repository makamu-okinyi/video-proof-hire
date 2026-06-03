/**
 * Edge function: Alert talent users when a new job is posted
 * Called from frontend after employer creates a job posting.
 * Emails all users with user_type='talent' about the new job.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobAlertRequest {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobType: string;
  location?: string;
}

function buildJobAlertHtml(params: {
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

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:42px;font-style:italic;font-weight:400;color:#1a1a1a;font-family:'Georgia','Times New Roman',serif;letter-spacing:-1px;">hello.</p>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">NEW OPPORTUNITY</p>
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
              A new position has been posted that might interest you.<br/><br/>
              <strong style="color:#1a1a1a;font-size:16px;">${jobTitle}</strong><br/>
              ${companyName} · ${jobType}${locationLine ? `<br/>${locationLine}` : ""}
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
                  <a href="https://hr.donjoafrica.com/jobs" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Jobs</a>
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
            <p style="margin:0;font-size:13px;color:#1a1a1a;letter-spacing:0.5px;">donjoafrica.com</p>
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
            <p style="margin:0;font-size:10px;color:#aaa;">This is an automated notification. Please do not reply to this email.</p>
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
    console.log("Job alert email sent to", to);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: JobAlertRequest = await req.json();
    const { jobId, jobTitle, companyName, jobType, location } = body;

    if (!jobId || !jobTitle) {
      return new Response(JSON.stringify({ error: "Missing jobId or jobTitle" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch all talent users
    const { data: talentProfiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("user_type", "talent");

    if (profilesErr || !talentProfiles?.length) {
      console.log("No talent profiles found or error:", profilesErr);
      return new Response(JSON.stringify({ success: true, emailsSent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let emailsSent = 0;
    const subject = `New Opportunity: ${jobTitle} at ${companyName || "Startup Garage"}`;

    // Send emails in batches of 5 to avoid rate limits
    for (let i = 0; i < talentProfiles.length; i += 5) {
      const batch = talentProfiles.slice(i, i + 5);
      await Promise.all(
        batch.map(async (profile) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
            const email = userData?.user?.email;
            if (!email) return;

            const recipientName = profile.username || email.split("@")[0];
            const html = buildJobAlertHtml({
              recipientName,
              jobTitle,
              companyName: companyName || "Startup Garage",
              jobType: jobType || "Full-time",
              location,
            });
            await sendEmail(email, subject, html);
            emailsSent++;
          } catch (e) {
            console.error("Error sending to profile", profile.id, e);
          }
        })
      );
    }

    console.log(`Job alert: ${emailsSent} emails sent for job "${jobTitle}"`);

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("job-posting-alert error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
