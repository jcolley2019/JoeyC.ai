import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

// Master X API credentials — OAuth 1.0a (Joey's account, fallback)
const X_API_KEY = Deno.env.get("X_API_KEY")!;
const X_API_SECRET = Deno.env.get("X_API_SECRET")!;
const X_ACCESS_TOKEN = Deno.env.get("X_ACCESS_TOKEN")!;
const X_ACCESS_TOKEN_SECRET = Deno.env.get("X_ACCESS_TOKEN_SECRET")!;

// OAuth 2.0 client credentials (for refreshing user tokens)
const X_CLIENT_ID = Deno.env.get("X_OAUTH_CLIENT_ID") || "";
const X_CLIENT_SECRET = Deno.env.get("X_OAUTH_CLIENT_SECRET") || "";

const X_API_BASE = "https://api.x.com/2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── OAuth 1.0a Signature ─────────────────────────────────────────────
// X API v2 still requires OAuth 1.0a HMAC-SHA1 for user-context requests

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return base64Encode(new Uint8Array(signature));
}

async function buildOAuthHeader(
  method: string,
  url: string,
  _bodyParams: Record<string, string> = {}
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  // For POST with JSON body, only oauth params go into the signature base
  // (body params are NOT included when Content-Type is application/json)
  const allParams = { ...oauthParams };

  // Sort and encode
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  // Signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

  // Signing key
  const signingKey = `${percentEncode(X_API_SECRET)}&${percentEncode(X_ACCESS_TOKEN_SECRET)}`;

  // HMAC-SHA1 signature
  const signature = await hmacSha1(signingKey, signatureBase);
  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

// ── OAuth 2.0 Token Refresh ──────────────────────────────────────────

async function refreshOAuth2Token(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  if (!X_CLIENT_ID || !X_CLIENT_SECRET) return null;

  try {
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

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ── X API v2 Calls ───────────────────────────────────────────────────

interface TweetResult {
  id: string;
  text: string;
}

// Post using OAuth 2.0 Bearer token (user-connected accounts)
async function postTweetOAuth2(
  accessToken: string,
  text: string,
  replyToId?: string
): Promise<TweetResult> {
  const url = `${X_API_BASE}/tweets`;
  const body: Record<string, unknown> = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`X API OAuth2 error (${response.status}):`, errText);
    throw new Error(`X API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return { id: data.data.id, text: data.data.text };
}

// Post using OAuth 1.0a HMAC-SHA1 (master account / fallback)
async function postTweet(
  text: string,
  replyToId?: string
): Promise<TweetResult> {
  const url = `${X_API_BASE}/tweets`;

  const body: Record<string, unknown> = { text };
  if (replyToId) {
    body.reply = { in_reply_to_tweet_id: replyToId };
  }

  const authHeader = await buildOAuthHeader("POST", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`X API error (${response.status}):`, errText);
    throw new Error(`X API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.data.id,
    text: data.data.text,
  };
}

// ── Thread Posting ───────────────────────────────────────────────────
// Posts an array of tweets as a thread (each reply to the previous one)
// oauth2Token: if provided, uses OAuth 2.0; otherwise uses OAuth 1.0a master tokens

async function postThread(
  tweets: string[],
  oauth2Token?: string
): Promise<{ tweets: TweetResult[]; threadUrl: string }> {
  if (tweets.length === 0) {
    throw new Error("No tweets to post");
  }

  const results: TweetResult[] = [];
  let previousId: string | undefined;

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i].trim();
    if (!text) continue;

    // Validate character limit
    if (text.length > 280) {
      throw new Error(
        `Tweet ${i + 1} exceeds 280 characters (${text.length} chars): "${text.substring(0, 50)}..."`
      );
    }

    const result = oauth2Token
      ? await postTweetOAuth2(oauth2Token, text, previousId)
      : await postTweet(text, previousId);
    results.push(result);
    previousId = result.id;

    // Small delay between tweets to avoid rate limiting
    if (i < tweets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Build thread URL from the first tweet
  const threadUrl = `https://x.com/i/status/${results[0].id}`;

  return { tweets: results, threadUrl };
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Resolve auth method ──────────────────────────────────────────
    // Priority: user's own OAuth 2.0 tokens > master OAuth 1.0a tokens
    let oauth2Token: string | undefined;
    let postingAs: string = "master";

    const { data: xAccount } = await adminClient
      .from("x_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (xAccount) {
      // Check if token is expired (or expires within 60s)
      const expiresAt = new Date(xAccount.token_expires_at).getTime();
      const now = Date.now();

      if (expiresAt - now < 60_000) {
        // Token expired or about to — try refresh
        const refreshed = await refreshOAuth2Token(xAccount.refresh_token);
        if (refreshed) {
          const newExpiry = new Date(now + refreshed.expires_in * 1000).toISOString();
          await adminClient
            .from("x_accounts")
            .update({
              access_token: refreshed.access_token,
              refresh_token: refreshed.refresh_token,
              token_expires_at: newExpiry,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          oauth2Token = refreshed.access_token;
          postingAs = xAccount.x_username;
        }
        // If refresh fails, fall through to master tokens
      } else {
        oauth2Token = xAccount.access_token;
        postingAs = xAccount.x_username;
      }
    }

    // If no user token, validate master credentials exist
    if (!oauth2Token && (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET)) {
      return new Response(
        JSON.stringify({ error: "No X account connected and master credentials not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mode, tweets, text } = await req.json();

    // mode: "single" — post one tweet
    // mode: "thread" — post array of tweets as a thread
    if (mode === "single") {
      if (!text || typeof text !== "string") {
        return new Response(JSON.stringify({ error: "text is required for single mode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (text.length > 280) {
        return new Response(JSON.stringify({ error: `Tweet exceeds 280 characters (${text.length})` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = oauth2Token
        ? await postTweetOAuth2(oauth2Token, text)
        : await postTweet(text);
      const tweetUrl = `https://x.com/i/status/${result.id}`;

      await adminClient.from("activity_log").insert({
        user_id: user.id,
        action: "post_to_x",
        metadata: { mode: "single", tweet_id: result.id, posting_as: postingAs },
      });

      return new Response(
        JSON.stringify({ success: true, tweet: result, url: tweetUrl, posting_as: postingAs }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "thread") {
      if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
        return new Response(JSON.stringify({ error: "tweets array is required for thread mode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { tweets: results, threadUrl } = await postThread(tweets, oauth2Token);

      await adminClient.from("activity_log").insert({
        user_id: user.id,
        action: "post_to_x",
        metadata: {
          mode: "thread",
          tweet_count: results.length,
          first_tweet_id: results[0].id,
          posting_as: postingAs,
        },
      });

      return new Response(
        JSON.stringify({ success: true, tweets: results, url: threadUrl, count: results.length, posting_as: postingAs }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode. Use "single" or "thread".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("post-to-x error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
