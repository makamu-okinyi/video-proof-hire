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

    // Get recipient's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", recipientId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Failed to get recipient email:", profileError);
      return new Response(
        JSON.stringify({ error: "Recipient email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let subject: string;
    let htmlContent: string;
    const recipientName = profile.username || "there";

    if (type === "new_message") {
      subject = `New message from ${data.senderName || "someone"}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B6B; margin-bottom: 20px;">New Message</h1>
          <p style="color: #333; font-size: 16px;">Hi ${recipientName},</p>
          <p style="color: #333; font-size: 16px;">You have a new message from <strong>${data.senderName || "someone"}</strong>:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; font-style: italic; margin: 0;">"${data.messagePreview || "..."}"</p>
          </div>
          <p style="color: #666; font-size: 14px;">Log in to your account to reply.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">— The SkillTok Team</p>
        </div>
      `;
    } else if (type === "application_status") {
      const statusText = data.status === "shortlisted" 
        ? "been shortlisted" 
        : data.status === "rejected" 
        ? "been reviewed" 
        : "been updated";
      
      subject = `Your job application has ${statusText}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B6B; margin-bottom: 20px;">Application Update</h1>
          <p style="color: #333; font-size: 16px;">Hi ${recipientName},</p>
          <p style="color: #333; font-size: 16px;">Your application for <strong>${data.jobTitle || "the position"}</strong> at <strong>${data.companyName || "the company"}</strong> has ${statusText}.</p>
          ${data.status === "shortlisted" ? `
            <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0;">🎉 Congratulations! The employer may reach out to you soon.</p>
            </div>
          ` : ""}
          <p style="color: #666; font-size: 14px;">Log in to your account to view more details.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">— The SkillTok Team</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending email to ${profile.email}`);

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SkillTok <onboarding@resend.dev>",
        to: [profile.email],
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
