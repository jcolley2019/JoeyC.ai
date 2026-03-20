import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if master_admin
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "master_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: master admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing pending invitation
    const { data: existing } = await adminClient
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: "An invitation is already pending for this email" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invitation record
    const { error: insertErr } = await adminClient.from("invitations").insert({
      email,
      invited_by: user.id,
      status: "pending",
    });

    if (insertErr) throw insertErr;

    // Send invite via Supabase Auth (sends magic link email)
    const siteUrl = Deno.env.get("SITE_URL") || "https://joeyc.ai";
    const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/command-center`,
    });

    if (inviteErr) {
      // If user already exists, that's okay — just mark invitation
      if (inviteErr.message?.includes("already been registered")) {
        return new Response(JSON.stringify({
          success: true,
          message: `${email} already has an account. They can log in at the command center.`,
          already_registered: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw inviteErr;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent to ${email}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
