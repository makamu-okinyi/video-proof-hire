import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_message" | "application_status";
  recipientId: string;
  data: {
    senderName?: string;
    messagePreview?: string;
    jobTitle?: string;
    status?: string;
    companyName?: string;
  };
}

// HTML escape function to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create client with user's auth context to verify JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !userData?.user) {
      console.error("Failed to verify user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const senderId = userData.user.id;
    console.log(`Authenticated user ${senderId} sending notification`);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipientId, data }: NotificationRequest = await req.json();

    // Validate input lengths to prevent abuse
    if (data.senderName && data.senderName.length > 100) {
      return new Response(
        JSON.stringify({ error: "senderName too long (max 100 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (data.messagePreview && data.messagePreview.length > 500) {
      return new Response(
        JSON.stringify({ error: "messagePreview too long (max 500 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (data.jobTitle && data.jobTitle.length > 200) {
      return new Response(
        JSON.stringify({ error: "jobTitle too long (max 200 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (data.companyName && data.companyName.length > 200) {
      return new Response(
        JSON.stringify({ error: "companyName too long (max 200 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prevent users from sending notifications to themselves
    if (senderId === recipientId) {
      return new Response(
        JSON.stringify({ error: "Cannot send notification to yourself" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing ${type} notification for user ${recipientId}`);

    // AUTHORIZATION CHECKS - Verify sender has permission to notify recipient
    if (type === "new_message") {
      // Verify sender and recipient are in a conversation together
      const { data: conversation, error: convoError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(employer_id.eq.${senderId},candidate_id.eq.${recipientId}),and(employer_id.eq.${recipientId},candidate_id.eq.${senderId})`)
        .maybeSingle();

      if (convoError) {
        console.error("Failed to verify conversation:", convoError);
        return new Response(
          JSON.stringify({ error: "Failed to verify conversation" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!conversation) {
        console.error(`No conversation found between ${senderId} and ${recipientId}`);
        return new Response(
          JSON.stringify({ error: "No conversation exists with this recipient" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (type === "application_status") {
      // Verify sender is the employer for a job application where recipient is the applicant
      const { data: application, error: appError } = await supabase
        .from("job_applications")
        .select("id, job_id, job_postings!inner(employer_id)")
        .eq("applicant_id", recipientId)
        .limit(1);

      if (appError) {
        console.error("Failed to verify job application:", appError);
        return new Response(
          JSON.stringify({ error: "Failed to verify job application" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if sender is the employer for any of the recipient's applications
      const isAuthorizedEmployer = application?.some(
        (app: any) => app.job_postings?.employer_id === senderId
      );

      if (!isAuthorizedEmployer) {
        console.error(`User ${senderId} is not authorized to notify applicant ${recipientId}`);
        return new Response(
          JSON.stringify({ error: "Unauthorized to notify this applicant" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get recipient's email from auth.users (emails are no longer stored in profiles)
    const { data: recipientUserData, error: recipientUserError } = await supabase.auth.admin.getUserById(recipientId);

    if (recipientUserError || !recipientUserData?.user?.email) {
      console.error("Failed to get recipient email:", recipientUserError);
      return new Response(
        JSON.stringify({ error: "Recipient email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const recipientEmail = recipientUserData.user.email;

    // Get recipient's username from profiles (for personalization)
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", recipientId)
      .single();

    // Fetch sender's username from database instead of trusting client input
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", senderId)
      .single();

    let subject: string;
    let htmlContent: string;
    const recipientName = escapeHtml(recipientProfile?.username || "there");
    // Use database username for sender, fallback to escaped client input or "Someone"
    const safeSenderName = escapeHtml(senderProfile?.username || data.senderName || "Someone");
    const safeMessagePreview = escapeHtml(data.messagePreview || "...");
    const safeJobTitle = escapeHtml(data.jobTitle || "the position");
    const safeCompanyName = escapeHtml(data.companyName || "the company");
    const safeStatus = escapeHtml(data.status || "updated");

    if (type === "new_message") {
      subject = `New message from ${safeSenderName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B6B; margin-bottom: 20px;">New Message</h1>
          <p style="color: #333; font-size: 16px;">Hi ${recipientName},</p>
          <p style="color: #333; font-size: 16px;">You have a new message from <strong>${safeSenderName}</strong>:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-style: italic; margin: 0;">"${safeMessagePreview}"</p>
          </div>
          <p style="color: #666; font-size: 14px;">Log in to your account to reply.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">— The SkillTok Team</p>
        </div>
      `;
    } else {
      const statusText = safeStatus === "shortlisted" 
        ? "been shortlisted" 
        : safeStatus === "rejected" 
        ? "been reviewed" 
        : "been updated";
      
      subject = `Your job application has ${statusText}`;
      htmlContent = `
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
          <p style="color: #999; font-size: 12px; margin-top: 40px;">— The SkillTok Team</p>
        </div>
      `;
    }

    console.log(`Sending email to ${recipientEmail}`);

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SkillTok <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
