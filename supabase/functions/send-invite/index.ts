import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── JoeyC.ai Branded Email Template ──────────────────────────
function buildInviteEmail(acceptUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <title>You're Invited to JoeyC.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Space Grotesk', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <span style="
                font-family: 'Orbitron', Arial, sans-serif;
                font-size: 32px;
                font-weight: 700;
                color: #1a8fff;
                letter-spacing: 0.08em;
              ">JoeyC.ai</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color: #0c1020;
              border: 1px solid #0f1a33;
              border-radius: 12px;
              padding: 44px 40px;
            ">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Accent line -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="width: 48px; height: 3px; background-color: #1a8fff; border-radius: 2px;"></div>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="
                    font-family: 'Orbitron', Arial, sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    color: #e8edf5;
                    letter-spacing: 0.02em;
                    padding-bottom: 20px;
                  ">You're Invited</td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="
                    font-family: 'Space Grotesk', Arial, sans-serif;
                    font-size: 15px;
                    line-height: 1.8;
                    color: #8892a4;
                    padding-bottom: 8px;
                  ">
                    <strong style="color: #e8edf5;">Joey Colley</strong> has invited you to join
                    <strong style="color: #1a8fff;">Content Studio</strong> — an AI-powered content
                    generation command center on JoeyC.ai.
                  </td>
                </tr>

                <tr>
                  <td style="
                    font-family: 'Space Grotesk', Arial, sans-serif;
                    font-size: 15px;
                    line-height: 1.8;
                    color: #8892a4;
                    padding-bottom: 32px;
                  ">
                    Create your account to start generating social posts, blog articles,
                    video scripts, and more — all from a single idea.
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 8px; background-color: #1a8fff;">
                          <a href="${acceptUrl}" target="_blank" style="
                            display: inline-block;
                            font-family: 'Orbitron', Arial, sans-serif;
                            font-size: 13px;
                            font-weight: 700;
                            letter-spacing: 0.08em;
                            text-transform: uppercase;
                            color: #0a0a0f;
                            text-decoration: none;
                            padding: 16px 36px;
                            border-radius: 8px;
                          ">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td style="
                    font-family: 'Space Grotesk', Arial, sans-serif;
                    font-size: 12px;
                    color: #8892a4;
                    line-height: 1.6;
                  ">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${acceptUrl}" style="color: #1a8fff; text-decoration: none; word-break: break-all; font-size: 11px;">${acceptUrl}</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 36px; text-align: center;">
              <p style="
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                color: #8892a4;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                margin: 0;
              ">// JoeyC.ai</p>
              <p style="
                font-family: 'Space Grotesk', Arial, sans-serif;
                font-size: 12px;
                color: #8892a4;
                margin: 8px 0 0;
                opacity: 0.6;
              ">Built Different. Built with AI.</p>
              <p style="
                font-family: 'Space Grotesk', Arial, sans-serif;
                font-size: 11px;
                color: #8892a4;
                margin: 16px 0 0;
                opacity: 0.4;
              ">
                <a href="https://joeyc.ai" style="color: #1a8fff; text-decoration: none;">joeyc.ai</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.tiktok.com/@buildaiwithjoey" style="color: #8892a4; text-decoration: none;">TikTok</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.instagram.com/gobuildai" style="color: #8892a4; text-decoration: none;">Instagram</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Edge Function ────────────────────────────────────────────
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

    // Create user in Supabase Auth (generates confirmation URL)
    // We suppress the default email by using generateLink instead of inviteUserByEmail
    const siteUrl = Deno.env.get("SITE_URL") || "https://joeyc.ai";
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `${siteUrl}/command-center`,
      },
    });

    if (linkErr) {
      // If user already exists, that's okay
      if (linkErr.message?.includes("already been registered")) {
        return new Response(JSON.stringify({
          success: true,
          message: `${email} already has an account. They can log in at the command center.`,
          already_registered: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw linkErr;
    }

    // Build the accept URL from the generated link
    const acceptUrl = linkData?.properties?.action_link || `${siteUrl}/command-center`;

    // Send branded email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Joey Colley <joey@joeyc.ai>",
        to: [email],
        subject: "You're invited to JoeyC.ai Content Studio",
        html: buildInviteEmail(acceptUrl),
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.text();
      console.error("Resend error:", resendErr);
      throw new Error(`Failed to send email via Resend: ${resendRes.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Branded invitation sent to ${email}`,
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
