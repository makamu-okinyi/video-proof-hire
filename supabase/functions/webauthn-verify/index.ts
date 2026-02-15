/**
 * WebAuthn verification Edge Function (MVP stub).
 * Validates assertion and returns Supabase session for the credential owner.
 * Deploy with: supabase functions deploy webauthn-verify
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { credentialId } = body;
    if (!credentialId) {
      return new Response(
        JSON.stringify({ error: "Missing credentialId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cred } = await supabase
      .from("webauthn_credentials")
      .select("user_id")
      .eq("credential_id", credentialId)
      .maybeSingle();

    if (!cred?.user_id) {
      return new Response(
        JSON.stringify({ error: "Credential not found. Use password to sign in, then enable fingerprint in Account Settings." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: sessionData, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: (await supabase.auth.admin.getUserById(cred.user_id)).data.user?.email ?? "",
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: sessionData.properties?.access_token,
        refresh_token: sessionData.properties?.refresh_token,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
