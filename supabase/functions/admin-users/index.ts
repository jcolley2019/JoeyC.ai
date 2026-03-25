import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hard-coded protection — these accounts can never be deleted
const PROTECTED_EMAILS = ["joey@joeyc.ai", "jcolley2019@gmail.com"];

// ── Shared auth + admin verification ─────────────────────────
async function verifyMasterAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) throw new Error("Unauthorized");

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
    throw new Error("Forbidden: master admin only");
  }

  return { user, adminClient };
}

// ── GET: Fetch users + activity ──────────────────────────────
async function handleGet(req: Request) {
  const { adminClient } = await verifyMasterAdmin(req);

  const {
    data: { users: authUsers },
    error: usersErr,
  } = await adminClient.auth.admin.listUsers();
  if (usersErr) throw usersErr;

  const { data: roles } = await adminClient
    .from("user_roles")
    .select("user_id, role");

  const roleMap = new Map(
    (roles || []).map((r: { user_id: string; role: string }) => [
      r.user_id,
      r.role,
    ])
  );

  const users = (authUsers || []).map((u) => ({
    id: u.id,
    email: u.email || "No email",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at || null,
    role: roleMap.get(u.id) || "user",
  }));

  const { data: activityData } = await adminClient
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const emailMap = new Map(users.map((u) => [u.id, u.email]));
  const activity = (activityData || []).map(
    (entry: Record<string, unknown>) => ({
      ...entry,
      user_email: emailMap.get(entry.user_id as string) || "Unknown",
    })
  );

  return { users, activity };
}

// ── POST: Admin actions ──────────────────────────────────────
async function handlePost(req: Request) {
  const { adminClient } = await verifyMasterAdmin(req);
  const body = await req.json();
  const { action } = body;

  // ── Delete single user ─────────────────────────────────────
  if (action === "delete_user") {
    const { user_id } = body;
    if (!user_id) throw new Error("user_id is required");

    // Check protected email
    const { data: targetUser } = await adminClient.auth.admin.getUserById(
      user_id
    );
    if (
      targetUser?.user &&
      PROTECTED_EMAILS.includes(targetUser.user.email ?? "")
    ) {
      throw new Error("Cannot delete a protected admin account");
    }

    // Check master_admin role
    const { data: targetRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (targetRole?.role === "master_admin") {
      throw new Error("Cannot delete a master_admin account");
    }

    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("activity_log").delete().eq("user_id", user_id);
    const { error: deleteErr } =
      await adminClient.auth.admin.deleteUser(user_id);
    if (deleteErr) throw deleteErr;

    return { success: true, message: "User deleted" };
  }

  // ── Delete multiple users ──────────────────────────────────
  if (action === "delete_users") {
    const { user_ids } = body;
    if (!Array.isArray(user_ids) || user_ids.length === 0)
      throw new Error("user_ids array is required");

    let deleted = 0;
    const errors: string[] = [];

    for (const uid of user_ids) {
      try {
        const { data: targetUser } =
          await adminClient.auth.admin.getUserById(uid);
        if (
          targetUser?.user &&
          PROTECTED_EMAILS.includes(targetUser.user.email ?? "")
        ) {
          errors.push(`${targetUser.user.email}: protected account`);
          continue;
        }

        const { data: targetRole } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .single();

        if (targetRole?.role === "master_admin") {
          errors.push(`${uid}: master_admin account`);
          continue;
        }

        await adminClient.from("user_roles").delete().eq("user_id", uid);
        await adminClient.from("activity_log").delete().eq("user_id", uid);
        await adminClient.auth.admin.deleteUser(uid);
        deleted++;
      } catch (e) {
        errors.push(
          `${uid}: ${e instanceof Error ? e.message : "unknown error"}`
        );
      }
    }

    return {
      success: true,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ── Delete single activity entry ───────────────────────────
  if (action === "delete_activity") {
    const { activity_id } = body;
    if (!activity_id) throw new Error("activity_id is required");
    await adminClient.from("activity_log").delete().eq("id", activity_id);
    return { success: true, message: "Activity entry deleted" };
  }

  // ── Delete multiple activity entries ───────────────────────
  if (action === "delete_activities") {
    const { activity_ids } = body;
    if (!Array.isArray(activity_ids) || activity_ids.length === 0)
      throw new Error("activity_ids array is required");
    await adminClient
      .from("activity_log")
      .delete()
      .in("id", activity_ids);
    return { success: true, deleted: activity_ids.length };
  }

  // ── Clear all activity ─────────────────────────────────────
  if (action === "clear_activity") {
    await adminClient
      .from("activity_log")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    return { success: true, message: "All activity cleared" };
  }

  throw new Error(`Unknown action: ${action}`);
}

// ── Edge Function ────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let result;
    if (req.method === "POST") {
      result = await handlePost(req);
    } else {
      result = await handleGet(req);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message === "Unauthorized"
      ? 401
      : message.startsWith("Forbidden")
        ? 403
        : 500;
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
