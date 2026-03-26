import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64UrlEncode } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

// OAuth 2.0 Client credentials (from X Developer Console → JOEYCAI app)
const X_CLIENT_ID = Deno.env.get("X_OAUTH_CLIENT_ID")!;
const X_CLIENT_SECRET = Deno.env.get("X_OAUTH_CLIENT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Scopes needed for posting tweets and reading user profile
const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

// ── PKCE Helpers ─────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

// ── Token Exchange ───────────────────────────────────────────────────

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const basicAuth = btoa(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`);

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Token exchange failed:", response.status, errText);
    throw new Error(`Token exchange failed (${response.status}): ${errText}`);
  }

  return await response.json();
}

// ── Refresh Token ────────────────────────────────────────────────────

async function refreshAccessToken(
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const basicAuth = btoa(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`);

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errText}`);
  }

  return await response.json();
}

// ── Get X User Info ──────────────────────────────────────────────────

async function getXUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; name: string }> {
  const response = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch X user info (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
  };
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify Supabase auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "X OAuth credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, code, redirect_uri, code_verifier } = await req.json();

    // ── ACTION: authorize ────────────────────────────────────────────
    // Returns the auth URL + PKCE code_verifier (client stores it temporarily)
    if (action === "authorize") {
      if (!redirect_uri) {
        return new Response(JSON.stringify({ error: "redirect_uri is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const params = new URLSearchParams({
        response_type: "code",
        client_id: X_CLIENT_ID,
        redirect_uri,
        scope: SCOPES.join(" "),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

      return new Response(
        JSON.stringify({ auth_url: authUrl, state, code_verifier: codeVerifier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: callback ─────────────────────────────────────────────
    // Exchanges the authorization code for tokens and saves to x_accounts
    if (action === "callback") {
      if (!code || !redirect_uri || !code_verifier) {
        return new Response(
          JSON.stringify({ error: "code, redirect_uri, and code_verifier are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, redirect_uri, code_verifier);

      // Get X user info
      const xUser = await getXUserInfo(tokens.access_token);

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Upsert into x_accounts (one X account per user)
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: upsertError } = await adminClient
        .from("x_accounts")
        .upsert(
          {
            user_id: user.id,
            x_user_id: xUser.id,
            x_username: xUser.username,
            x_display_name: xUser.name,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            scopes: SCOPES,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        console.error("Failed to save X account:", upsertError);
        throw new Error("Failed to save X account connection");
      }

      // Log activity
      await adminClient.from("activity_log").insert({
        user_id: user.id,
        action: "x_account_connected",
        metadata: { x_username: xUser.username, x_user_id: xUser.id },
      });

      return new Response(
        JSON.stringify({
          success: true,
          x_username: xUser.username,
          x_display_name: xUser.name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: refresh ──────────────────────────────────────────────
    // Refreshes an expired access token
    if (action === "refresh") {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: xAccount, error: fetchError } = await adminClient
        .from("x_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !xAccount) {
        return new Response(
          JSON.stringify({ error: "No X account connected" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await refreshAccessToken(xAccount.refresh_token);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await adminClient
        .from("x_accounts")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, expires_at: expiresAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: disconnect ───────────────────────────────────────────
    // Removes the user's X account connection
    if (action === "disconnect") {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await adminClient
        .from("x_accounts")
        .delete()
        .eq("user_id", user.id);

      await adminClient.from("activity_log").insert({
        user_id: user.id,
        action: "x_account_disconnected",
        metadata: {},
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: status ───────────────────────────────────────────────
    // Returns connection status for the current user
    if (action === "status") {
      const { data: xAccount } = await supabase
        .from("x_accounts")
        .select("x_username, x_display_name, token_expires_at, connected_at")
        .eq("user_id", user.id)
        .single();

      return new Response(
        JSON.stringify({
          connected: !!xAccount,
          x_username: xAccount?.x_username || null,
          x_display_name: xAccount?.x_display_name || null,
          token_expires_at: xAccount?.token_expires_at || null,
          connected_at: xAccount?.connected_at || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "authorize", "callback", "refresh", "disconnect", or "status".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("x-oauth error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
