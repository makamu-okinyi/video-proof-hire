/**
 * Edge function: Notify on job/venture status change
 * - Inserts into notifications table
 * - Creates conversation + auto-message (approval/rejection)
 * - Sends email via Resend (clean minimal "hello." card design)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  type: "job_status" | "venture_status";
  recipientId: string;
  status: "shortlisted" | "rejected";
  data: {
    jobApplicationId?: string;
    jobId?: string;
    jobTitle?: string;
    companyName?: string;
    ventureId?: string;
    ventureName?: string;
  };
}

function buildEmailHtml(params: {
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

        <!-- Top padding -->
        <tr><td style="height:48px;"></td></tr>

        <!-- "hello." script heading -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:42px;font-style:italic;font-weight:400;color:#1a1a1a;font-family:'Georgia','Times New Roman',serif;letter-spacing:-1px;">hello.</p>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <!-- Verdict headline -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;">${title}</p>
          </td>
        </tr>

        <tr><td style="height:16px;"></td></tr>

        <!-- Thin divider -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <div style="width:50px;height:1px;background:#1a1a1a;"></div>
          </td>
        </tr>

        <tr><td style="height:20px;"></td></tr>

        <!-- Verdict badge -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${verdictColor};color:#ffffff;padding:8px 24px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;">
                  ${verdictLabel}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <!-- Body text -->
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

        <!-- Thin divider -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <div style="width:50px;height:1px;background:#1a1a1a;"></div>
          </td>
        </tr>

        <tr><td style="height:24px;"></td></tr>

        <!-- Website link -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:13px;color:#1a1a1a;letter-spacing:0.5px;">donjoafrica.com</p>
          </td>
        </tr>

        <tr><td style="height:8px;"></td></tr>

        <!-- Tagline -->
        <tr>
          <td align="center" style="padding:0 40px;">
            <p style="margin:0;font-size:11px;color:#999;">Startup Garage by Donjo Africa</p>
          </td>
        </tr>

        <tr><td style="height:40px;"></td></tr>

      </table>

      <!-- Footer outside card -->
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
    console.log("Email sent to", to);
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

    const senderId = user.id;
    const body: NotifyRequest = await req.json();
    const { type, recipientId, status, data } = body;

    if (!type || !recipientId || !status || senderId === recipientId) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const notifType = type === "job_status"
      ? (status === "shortlisted" ? "job_shortlisted" : "job_rejected")
      : (status === "shortlisted" ? "pitch_shortlisted" : "pitch_rejected");

    const statusText = status === "shortlisted" ? "shortlisted" : "rejected";
    let title = "";
    let message = "";
    let actionUrl = "/notifications";

    if (type === "job_status") {
      const jobTitle = data.jobTitle || "the position";
      const companyName = data.companyName || "the company";
      title = `Application ${statusText}`;
      message = `Your application for ${jobTitle} at ${companyName} has been ${statusText}.`;
      actionUrl = "/messages";
    } else {
      const ventureName = data.ventureName || "your venture";
      title = `Pitch ${statusText}`;
      message = `${ventureName} has been ${statusText} by the review team.`;
      actionUrl = "/founder";
    }

    // 1. Insert notification
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: notifType,
      title,
      message,
      action_url: actionUrl,
      is_read: false,
      related_user_id: senderId,
      related_job_id: data.jobId || null,
      related_venture_id: data.ventureId || null,
    });

    // 2. Create or get conversation, insert auto-message
    const employerId = senderId;
    const candidateId = recipientId;

    if (type === "job_status" && data.jobApplicationId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("employer_id", employerId)
        .eq("candidate_id", candidateId)
        .eq("job_application_id", data.jobApplicationId)
        .maybeSingle();

      let convId = existing?.id;
      if (!convId) {
        const { data: inserted, error: insErr } = await supabase
          .from("conversations")
          .insert({
            employer_id: employerId,
            candidate_id: candidateId,
            job_application_id: data.jobApplicationId,
          })
          .select("id")
          .single();
        if (insErr) {
          console.error("Failed to create job conversation:", insErr);
        } else {
          convId = inserted?.id;
        }
      }
      if (convId) {
        const autoMessage = status === "shortlisted"
          ? "Congratulations! Your application has been shortlisted. We may reach out to you soon."
          : "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.";
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: senderId,
          content: autoMessage,
        });
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }
    } else if (type === "venture_status") {
      // Skip venture conversation creation — conversations table doesn't have venture_id column
      console.log("Venture status updated, skipping conversation creation (no venture_id column).");
    }

    // 3. Send email via Resend
    const { data: recipientUser } = await supabase.auth.admin.getUserById(recipientId);
    const recipientEmail = recipientUser?.user?.email;
    const recipientName = recipientUser?.user?.user_metadata?.username
      || recipientUser?.user?.email?.split("@")[0]
      || "Applicant";

    if (recipientEmail) {
      const emailSubject = status === "shortlisted"
        ? `✓ ${title} — Startup Garage`
        : `${title} — Startup Garage`;
      const emailHtml = buildEmailHtml({
        status,
        type,
        title,
        message,
        recipientName,
      });
      await sendEmail(recipientEmail, emailSubject, emailHtml);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("notify-status-change error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
