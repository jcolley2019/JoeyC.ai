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

    // Fetch all users from auth.users (requires service role)
    const { data: { users: authUsers }, error: usersErr } = await adminClient.auth.admin.listUsers();
    if (usersErr) throw usersErr;

    // Fetch all roles
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map((roles || []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

    const users = (authUsers || []).map((u) => ({
      id: u.id,
      email: u.email || "No email",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      role: roleMap.get(u.id) || "user",
    }));

    // Fetch activity log with user emails (last 200 entries)
    const { data: activityData } = await adminClient
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    // Map user emails onto activity entries
    const emailMap = new Map(users.map((u) => [u.id, u.email]));
    const activity = (activityData || []).map((entry: Record<string, unknown>) => ({
      ...entry,
      user_email: emailMap.get(entry.user_id as string) || "Unknown",
    }));

    return new Response(JSON.stringify({ users, activity }), {
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
