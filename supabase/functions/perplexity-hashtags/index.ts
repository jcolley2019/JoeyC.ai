import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Extract 3-5 topic keywords from input text
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'and', 'but', 'or', 'not', 'so', 'yet', 'both',
    'all', 'any', 'some', 'no', 'only', 'very', 'just', 'about', 'up',
    'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we',
    'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
    'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'if',
    'while', 'also', 'like', 'get', 'got', 'one', 'use', 'used', 'using',
    'make', 'made', 'really', 'thing', 'things', 'way',
  ]);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: "Perplexity API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { input_text, platforms } = await req.json();

    const keywords = extractKeywords(input_text || "");
    if (keywords.length === 0) {
      return new Response(JSON.stringify({ hashtags: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platformList = (platforms && platforms.length > 0)
      ? platforms.join(", ")
      : "TikTok, Instagram, Pinterest, X";

    const today = new Date().toISOString().split("T")[0];

    const query = `What are the currently trending and high-performing hashtags for content about ${keywords.join(", ")} on ${platformList}? Date: ${today}. Return hashtags grouped by platform. Include engagement levels or trending status if available. Focus on hashtags with active engagement right now, not generic evergreen ones. Mix trending (riding current waves), niche (targeted reach), and evergreen (consistent discovery) hashtags. Every hashtag must include the # symbol.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a social media hashtag research assistant. Return only hashtag data grouped by platform. Be concise and data-driven. Every hashtag must include the # symbol. Focus on currently trending hashtags with real engagement.",
          },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error("Perplexity API error:", res.status, errText);
      // Silent fallback
      return new Response(JSON.stringify({ hashtags: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const hashtags = data.choices?.[0]?.message?.content || null;

    return new Response(JSON.stringify({ hashtags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Perplexity hashtag research error:", err);
    // Silent fallback — return null so Claude handles hashtags
    return new Response(JSON.stringify({ hashtags: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
