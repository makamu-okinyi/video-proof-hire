/**
 * Edge function: Notify on job/venture status change
 * - Inserts into notifications table
 * - Creates conversation + auto-message (approval/rejection)
 * - Sends email via Resend to the user's signup email
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
  const accentColor = "#c9a96e";
  const isApproved = status === "shortlisted";
  const verdictLabel = isApproved ? "SHORTLISTED" : "NOT SELECTED";
  const verdictColor = isApproved ? "#2d6a4f" : "#9b2226";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e4de;">
        <!-- Header with accent bar -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${accentColor};height:6px;"></td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Logo / Brand -->
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:700;letter-spacing:2px;color:#1a1a1a;">VENTURE</span><br/>
                  <span style="font-size:22px;font-weight:700;letter-spacing:2px;color:#1a1a1a;">ENGINE</span>
                </td>
                <td align="right" valign="top">
                  <div style="width:40px;height:40px;border:2px solid ${accentColor};display:inline-block;transform:rotate(45deg);margin-top:4px;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Recipient & Date -->
        <tr>
          <td style="padding:24px 40px 0 40px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${recipientName}</p>
            <p style="margin:4px 0 0 0;font-size:12px;color:#888;">${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
          </td>
        </tr>
        <!-- Subject -->
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#555;letter-spacing:1px;text-transform:uppercase;">${title}</p>
          </td>
        </tr>
        <!-- Verdict Badge -->
        <tr>
          <td style="padding:16px 40px 0 40px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${verdictColor};color:#ffffff;padding:8px 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;">
                  ${verdictLabel}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:24px 40px 0 40px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">${message}</p>
          </td>
        </tr>
        ${isApproved ? `
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">
              We will be in touch shortly with next steps. Please check your messages on the platform for further details.
            </p>
          </td>
        </tr>` : `
        <tr>
          <td style="padding:20px 40px 0 40px;">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">
              We appreciate your time and effort. We encourage you to continue refining your ${type === "venture_status" ? "pitch" : "application"} and apply again in the future.
            </p>
          </td>
        </tr>`}
        <!-- Signature -->
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #e8e4de;padding-top:20px;">
                  <div style="width:32px;height:1px;background:${accentColor};margin-bottom:12px;"></div>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;font-style:italic;">The Venture Engine Team</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#888;">Program Administration</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #e8e4de;padding-top:16px;">
                  <p style="margin:0;font-size:11px;color:#aaa;">This is an automated notification from Venture Engine. Please do not reply to this email.</p>
                </td>
              </tr>
            </table>
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
      from: "Venture Engine <onboarding@resend.dev>",
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
    } else if (type === "venture_status" && data.ventureId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("employer_id", employerId)
        .eq("candidate_id", candidateId)
        .eq("venture_id", data.ventureId)
        .is("job_application_id", null)
        .maybeSingle();

      let convId = existing?.id;
      if (!convId) {
        const { data: inserted, error: insErr } = await supabase
          .from("conversations")
          .insert({
            employer_id: employerId,
            candidate_id: candidateId,
            venture_id: data.ventureId,
          })
          .select("id")
          .single();
        if (insErr) {
          console.error("Failed to create venture conversation:", insErr);
        } else {
          convId = inserted?.id;
        }
      }
      if (convId) {
        const autoMessage = status === "shortlisted"
          ? "Congratulations! Your pitch has been shortlisted. Our team will be in touch."
          : "Thank you for applying. Unfortunately, we have decided not to move forward with your pitch at this time.";
        await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: senderId,
          content: autoMessage,
        });
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }
    }

    // 3. Send email via Resend to the recipient's signup email
    const { data: recipientUser } = await supabase.auth.admin.getUserById(recipientId);
    const recipientEmail = recipientUser?.user?.email;
    const recipientName = recipientUser?.user?.user_metadata?.username
      || recipientUser?.user?.email?.split("@")[0]
      || "Applicant";

    if (recipientEmail) {
      const emailSubject = status === "shortlisted"
        ? `✓ ${title} — Venture Engine`
        : `${title} — Venture Engine`;
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
