import { requireUser } from "../_shared/auth.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";

const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");

// Hard cap on input size so an authenticated caller cannot burn a max-size
// Sonnet call per request (L3-01). The Studio sends one input panel's text.
const MAX_TEXT_CHARS = 20_000;

// target_language is interpolated into the system prompt, so it is restricted
// to a fixed list instead of accepting arbitrary instructions (L3-01).
const ALLOWED_LANGUAGES = new Set([
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
]);

const json = (corsHeaders: Record<string, string>, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(corsHeaders, { error: "Method not allowed" }, 405);
  }

  // Auth gate runs before the body is parsed and before any external call.
  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { text, target_language } = await req.json();

    if (typeof text !== "string" || !text.trim() || typeof target_language !== "string") {
      return json(corsHeaders, { error: "text and target_language required" }, 400);
    }

    if (text.length > MAX_TEXT_CHARS) {
      return json(corsHeaders, { error: `text exceeds ${MAX_TEXT_CHARS} characters` }, 400);
    }

    if (!ALLOWED_LANGUAGES.has(target_language)) {
      return json(corsHeaders, { error: "Unsupported target_language" }, 400);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: `You are a professional translator. Translate the following text to ${target_language}. Preserve the original tone, formatting, and meaning exactly. Do not add explanations — return only the translated text.`,
        messages: [{ role: "user", content: text }],
      }),
    });

    const data = await response.json();
    const translated = data.content?.[0]?.text || "";

    return json(corsHeaders, { translated });
  } catch (err) {
    return json(corsHeaders, { error: String(err) }, 500);
  }
});
