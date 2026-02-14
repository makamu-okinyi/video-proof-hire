/**
 * Edge function: Notify on job/venture status change
 * - Inserts into notifications table
 * - Creates conversation + auto-message (approval/rejection)
 * - Optionally sends email via Resend
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

    // Verify caller with anon key + user JWT
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
