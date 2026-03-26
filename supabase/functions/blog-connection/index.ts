import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Encryption key for blog credentials — set via: supabase secrets set BLOG_CREDENTIALS_KEY=...
const CREDENTIALS_KEY = Deno.env.get("BLOG_CREDENTIALS_KEY") || "default-key-change-me";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Simple AES-GCM Encryption ────────────────────────────────────────

async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("blog-creds-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data: string): Promise<string> {
  const key = await deriveKey(CREDENTIALS_KEY);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // Combine IV + ciphertext, base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string): Promise<string> {
  const key = await deriveKey(CREDENTIALS_KEY);
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── WordPress REST API Publishing ────────────────────────────────────

async function publishToWordPress(
  siteUrl: string,
  credentials: { username: string; app_password: string },
  post: { title: string; content: string; status: string }
): Promise<{ id: number; link: string }> {
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const auth = btoa(`${credentials.username}:${credentials.app_password}`);

  const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      status: post.status || "draft",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`WordPress API error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return { id: data.id, link: data.link };
}

// ── Ghost Admin API Publishing ───────────────────────────────────────

async function createGhostToken(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split(":");
  if (!id || !secret) throw new Error("Invalid Ghost Admin API key format (expected id:secret)");

  const encoder = new TextEncoder();
  const keyBytes = Uint8Array.from(
    (secret.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16))
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // JWT header and payload
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(`${header}.${payload}`)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${header}.${payload}.${sig}`;
}

async function publishToGhost(
  siteUrl: string,
  credentials: { admin_api_key: string },
  post: { title: string; content: string; status: string }
): Promise<{ id: string; url: string }> {
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const token = await createGhostToken(credentials.admin_api_key);

  // Ghost expects mobiledoc or html — we'll use html
  const response = await fetch(`${baseUrl}/ghost/api/admin/posts/?source=html`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Ghost ${token}`,
    },
    body: JSON.stringify({
      posts: [{
        title: post.title,
        html: post.content,
        status: post.status || "draft",
      }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ghost API error (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const created = data.posts[0];
  return { id: created.id, url: created.url };
}

// ── Markdown to HTML (simple) ────────────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^\> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith("<")) return line;
      return line;
    })
    .replace(/^(?!<)(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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

    const body = await req.json();
    const { action } = body;

    // ── ACTION: connect ──────────────────────────────────────────────
    if (action === "connect") {
      const { platform, site_url, credentials } = body;

      if (!platform || !site_url || !credentials) {
        return new Response(JSON.stringify({ error: "platform, site_url, and credentials are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["wordpress", "ghost"].includes(platform)) {
        return new Response(JSON.stringify({ error: "Unsupported platform. Use 'wordpress' or 'ghost'." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Test the connection first
      try {
        if (platform === "wordpress") {
          const baseUrl = site_url.replace(/\/+$/, "");
          const auth = btoa(`${credentials.username}:${credentials.app_password}`);
          const testRes = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (!testRes.ok) throw new Error(`WordPress auth failed (${testRes.status})`);
        } else if (platform === "ghost") {
          const baseUrl = site_url.replace(/\/+$/, "");
          const ghostToken = await createGhostToken(credentials.admin_api_key);
          const testRes = await fetch(`${baseUrl}/ghost/api/admin/site/`, {
            headers: { Authorization: `Ghost ${ghostToken}` },
          });
          if (!testRes.ok) throw new Error(`Ghost auth failed (${testRes.status})`);
        }
      } catch (err) {
        return new Response(
          JSON.stringify({ error: `Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Encrypt credentials and save
      const encrypted = await encrypt(JSON.stringify(credentials));

      const { error: upsertError } = await adminClient
        .from("user_blog_connections")
        .upsert({
          user_id: user.id,
          platform,
          site_url: site_url.replace(/\/+$/, ""),
          credentials_encrypted: encrypted,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,platform" });

      if (upsertError) {
        throw new Error(`Failed to save connection: ${upsertError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, platform, site_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: disconnect ───────────────────────────────────────────
    if (action === "disconnect") {
      const { platform } = body;
      await adminClient
        .from("user_blog_connections")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", platform);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: status ───────────────────────────────────────────────
    if (action === "status") {
      const { data: connections } = await supabase
        .from("user_blog_connections")
        .select("platform, site_url, connected_at")
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ connections: connections || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: publish ──────────────────────────────────────────────
    if (action === "publish") {
      const { platform, title, content } = body;

      if (!platform || !title || !content) {
        return new Response(JSON.stringify({ error: "platform, title, and content are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get connection
      const { data: conn, error: connError } = await adminClient
        .from("user_blog_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .single();

      if (connError || !conn) {
        return new Response(JSON.stringify({ error: `No ${platform} connection found. Connect your blog first.` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decrypt credentials
      const credentials = JSON.parse(await decrypt(conn.credentials_encrypted));
      const html = markdownToHtml(content);

      let result: { url: string };

      if (platform === "wordpress") {
        const wpResult = await publishToWordPress(conn.site_url, credentials, {
          title,
          content: html,
          status: "draft", // Always publish as draft for safety
        });
        result = { url: wpResult.link };
      } else if (platform === "ghost") {
        const ghostResult = await publishToGhost(conn.site_url, credentials, {
          title,
          content: html,
          status: "draft",
        });
        result = { url: ghostResult.url };
      } else {
        return new Response(JSON.stringify({ error: "Unsupported platform" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log activity
      await adminClient.from("activity_log").insert({
        user_id: user.id,
        action: "blog_publish_external",
        metadata: { platform, site_url: conn.site_url },
      });

      return new Response(
        JSON.stringify({ success: true, url: result.url, platform, status: "draft" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "connect", "disconnect", "status", or "publish".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("blog-connection error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
