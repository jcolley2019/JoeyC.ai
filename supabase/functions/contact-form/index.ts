// contact-form — public lead-capture endpoint for the landing page.
//
// History: this function was deployed (v18, verify_jwt false) without source in
// the repo. JCAI-FIX-01/S5 brought it back and hardened it (finding L3-11):
//   * every field the form sends is validated and stored (needs the columns
//     from supabase/migrations/20260923232532_security_hardening.sql)
//   * every user value is HTML-escaped before it reaches the email
//   * the "confirmation" email to the submitter is gone — it let anyone send a
//     "from Joey Colley" HTML email to any address; the UI success state is enough
//   * honeypot field, per-IP rate limit, and a CORS allow-list
//
// No user session by design (verify_jwt = false in config.toml).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { escapeHtml } from "../_shared/html.ts";
import { requireEnv } from "../_shared/env.ts";

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

// ── Config ───────────────────────────────────────────────────────────────────

const CANONICAL_ORIGIN = "https://www.joeyc.ai";
const ALLOWED_ORIGINS = new Set<string>([CANONICAL_ORIGIN]);
if (Deno.env.get("ENV") === "dev") {
  ALLOWED_ORIGINS.add("http://localhost:5173");
}

const NOTIFY_TO = "joey@joeyc.ai";
const NOTIFY_FROM = "JoeyC.ai <noreply@joeyc.ai>";

const RATE_LIMIT_MAX = 3; // submissions
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // per hour, per IP hash

const LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  service: 100,
  painPoint: 100,
  budget: 100,
  timeline: 100,
  company: 100,
  website: 200,
} as const;

// Deliberately simple: one "@", no whitespace, a dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : CANONICAL_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(cors: Record<string, string>, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Drop C0/C1 control characters. Multi-line fields keep \n and \t. */
function stripControl(value: string, multiline: boolean): string {
  // deno-lint-ignore no-control-regex
  const re = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g : /[\u0000-\u001F\u007F-\u009F]/g; // eslint-disable-line no-control-regex -- stripping control characters is this validator's purpose
  return value.replace(re, "").replace(/\r\n?/g, multiline ? "\n" : " ");
}

type FieldSpec = { key: keyof typeof LIMITS; required: boolean; multiline?: boolean };

const FIELDS: FieldSpec[] = [
  { key: "name", required: true },
  { key: "email", required: true },
  { key: "message", required: true, multiline: true },
  { key: "service", required: false },
  { key: "painPoint", required: false },
  { key: "budget", required: false },
  { key: "timeline", required: false },
  { key: "company", required: false },
  { key: "website", required: false },
];

type Clean = Record<keyof typeof LIMITS, string>;

/** Returns the cleaned fields, or a user-facing error string. */
function validate(body: Record<string, unknown>): { ok: true; data: Clean } | { ok: false; error: string } {
  const out = {} as Clean;

  for (const { key, required, multiline } of FIELDS) {
    const raw = body[key];
    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      return { ok: false, error: `${key} must be text` };
    }
    const value = stripControl((raw as string | undefined) ?? "", !!multiline).trim();

    if (required && !value) {
      return { ok: false, error: `${key === "message" ? "Tell me a bit about your project" : `${key} is required`}` };
    }
    if (value.length > LIMITS[key]) {
      return { ok: false, error: `${key} must be ${LIMITS[key]} characters or fewer` };
    }
    out[key] = value;
  }

  if (!EMAIL_RE.test(out.email)) {
    return { ok: false, error: "Please enter a valid email address" };
  }

  return { ok: true, data: out };
}

async function hashIp(req: Request): Promise<string> {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || "unknown";
  // Salt so the stored hash cannot be reversed by hashing the IPv4 space.
  // Set CONTACT_IP_SALT in the function secrets; an unset salt still hashes
  // (rate limiting must never fail open), it is just weaker.
  const salt = Deno.env.get("CONTACT_IP_SALT") ?? "";
  const bytes = new TextEncoder().encode(`${ip}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildNotificationHtml(d: Clean): string {
  // Every value goes through escapeHtml — d.* is untrusted input.
  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:4px 12px 4px 0;color:#888;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
      : "";

  const message = escapeHtml(d.message).replace(/\n/g, "<br>");

  return [
    `<h2 style="margin:0 0 12px">New contact form submission</h2>`,
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">`,
    row("Name", d.name),
    row("Email", d.email),
    row("Service", d.service),
    row("Pain point", d.painPoint),
    row("Budget", d.budget),
    row("Timeline", d.timeline),
    row("Company", d.company),
    row("Website", d.website),
    `</table>`,
    `<p style="margin:16px 0 4px;color:#888">Message</p>`,
    `<p style="white-space:normal">${message}</p>`,
    `<hr style="border:0;border-top:1px solid #ddd;margin:16px 0">`,
    `<p style="color:#888;font-size:12px">Sent from the JoeyC.ai contact form</p>`,
  ].join("");
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json(cors, { error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json(cors, { error: "Invalid request body" }, 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json(cors, { error: "Invalid request body" }, 400);
  }

  // Honeypot: real users never see or fill website_hp. Bots that do get a
  // quiet 200 and nothing is stored or emailed.
  if (typeof body.website_hp === "string" && body.website_hp.trim() !== "") {
    return json(cors, { success: true });
  }

  const validated = validate(body);
  if (!validated.ok) {
    return json(cors, { error: validated.error }, 400);
  }
  const data = validated.data;

  try {
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    // Rate limit: count this IP hash's rows in the last hour.
    const ipHash = await hashIp(req);
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (countError) {
      // Fail closed: if we cannot count, do not accept the submission.
      console.error("contact-form: rate limit query failed:", countError.message);
      return json(cors, { error: "Something went wrong. Try again in a moment." }, 500);
    }
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return json(cors, { error: "Too many messages from your network. Try again in an hour." }, 429);
    }

    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      message: data.message,
      service: data.service || null,
      pain_point: data.painPoint || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
      company: data.company || null,
      website: data.website || null,
      ip_hash: ipHash,
    });

    if (dbError) {
      console.error("contact-form: insert failed:", dbError.message);
      return json(cors, { error: "Failed to save submission" }, 500);
    }

    // Notification to the owner only. The row is already saved, so an email
    // failure is logged but does not turn into a user-facing error (a retry
    // would just duplicate the lead).
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("contact-form: RESEND_API_KEY not configured; submission stored without email");
      return json(cors, { success: true });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: data.email, // validated by EMAIL_RE above; Resend takes JSON, so no header injection
        subject: `New contact form submission from ${data.name}`,
        html: buildNotificationHtml(data),
      }),
    });

    if (!emailRes.ok) {
      console.error("contact-form: Resend responded", emailRes.status);
    }

    return json(cors, { success: true });
  } catch (err) {
    console.error("contact-form: unhandled error:", err instanceof Error ? err.message : String(err));
    return json(cors, { error: "Internal server error" }, 500);
  }
});
