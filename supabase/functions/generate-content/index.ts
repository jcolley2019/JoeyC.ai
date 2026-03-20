import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

// Model tiers — Sonnet 4.6 for research-heavy blog, Haiku 4.5 for derivatives
const MODELS = {
  research: "claude-sonnet-4-6",       // Blog posts with web search
  standard: "claude-sonnet-4-6",       // Direct generation (non-cascade)
  derivative: "claude-haiku-4-5-20251001", // Cheap reformatting from blog content
};

// Cost controls
const MAX_WEB_SEARCHES = 5;       // Max web search invocations per blog post
const MAX_TOKENS_BLOG = 4096;     // Blog generation
const MAX_TOKENS_DERIVATIVE = 2048; // Social/thread derivatives (shorter output)
const MAX_TOKENS_STANDARD = 4096;  // Non-cascade generation
const DAILY_GENERATION_LIMIT = 50; // Per user per day

// Anti-AI-slop writing directive — applied to ALL content types
const ANTI_SLOP_DIRECTIVE = `

## WRITING RULES — MANDATORY

Write like a real human. The following are BANNED — never use them:

**Banned words:** delve, embark, leverage (as verb), utilize, harness, unleash, revolutionize, groundbreaking, game-changer, cutting-edge, robust (as filler), streamline, synergy, paradigm, ecosystem (as metaphor), tapestry, landscape (as metaphor), beacon, treasure trove, testament, amplify, resonate, interplay, paramount, profound, indelible, bespoke, foster, endeavor, esteemed, realm, furthermore, moreover, underscore, pivotal, nuanced, multifaceted, holistic, comprehensive (as filler), arguably, remarkably, fundamentally, certainly, absolutely

**Banned phrases:** "in today's fast-paced world", "dive into", "deep dive", "it's important to note", "it's worth noting", "at the end of the day", "the bottom line", "unlock the potential", "move the needle", "navigate the complexities", "in the realm of", "pave the way", "it goes without saying", "needless to say", "without further ado", "a perfect storm", "shed light on", "in conclusion", "stands as a testament", "rich tapestry", "let's explore", "let's unpack", "ever-evolving", "rapidly evolving"

**Banned patterns:**
- Negation trope: "It's not just X, it's Y" — unless making a genuine distinction
- False exclusivity: "nobody talks about this" / "what most people miss" — unless genuinely obscure
- Adverb stuffing: "quietly", "deeply", "remarkably" as empty emphasis
- Starting paragraphs with "In today's..."
- Corporate buzzword chains
- Grandiose claims without specific evidence

**Write like this instead:**
- Short sentences. Mix in fragments. Vary rhythm.
- Specific > vague. "I built this in 3 hours with Cursor" beats "AI tools can accelerate development"
- Personal stories > generic advice
- Say it directly — no throat-clearing phrases
- Simple words: "use" not "utilize", "start" not "embark", "look at" not "delve into"
- Be opinionated. Real people have takes.
- Sound like you're texting a smart friend, not writing a press release

**Tool name corrections — MANDATORY:**
- Google's AI video tool is called "Veo 3" (NOT "Vevo" — that is a music video platform, completely unrelated)
- Always double-check AI tool names: Cursor, Claude, Gemini, Veo 3, Midjourney, Runway, Sora, etc.

**Hashtag generation — MANDATORY for all platforms:**
- Use web search to find currently trending and high-performing hashtags relevant to the topic, platform, and creator niche BEFORE selecting hashtags
- Search for recent hashtag performance data — look for engagement volume, trending status, and relevance
- Prioritize hashtags with active engagement over generic or stale ones
- Mix trending hashtags (riding current waves) with niche hashtags (targeted reach) and evergreen hashtags (consistent discovery)
- Every hashtag MUST include the # symbol`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSystemPrompt(
  outputFormat: string,
  platform?: string
): string {
  const base =
    "You are a content creation assistant for Joey Colley, a non-traditional AI developer who builds apps with AI tools and documents the journey on social media. Joey's voice is authentic, conversational, slightly irreverent, and anti-corporate-slop. He speaks plainly, uses short sentences, and connects with people who are curious about AI but aren't traditional engineers." + ANTI_SLOP_DIRECTIVE;

  if (outputFormat === "social") {
    const platformGuides: Record<string, string> = {
      tiktok: `Create a complete TikTok content package. Format your output with these clearly labeled sections:

**🎬 HOOK (first 3 seconds)**
Write the exact opening line/action that stops the scroll. This is the most important part — it should create curiosity or make a bold claim. Write 2-3 hook options.

**📝 SCRIPT**
Write a full talking-head script, 30-60 seconds worth. Use short punchy sentences. Include stage directions in [brackets] like [show screen] or [cut to demo]. Write it exactly how Joey would say it out loud — casual, real, no corporate speak.

**💬 CAPTION**
Write the post caption. Keep it punchy with line breaks. Conversational tone.

**📣 CTA (call to action)**
What Joey tells viewers to do at the end of the video AND in the caption. Make it specific and actionable.

**#️⃣ HASHTAGS**
5-8 relevant hashtags. Mix trending and niche. IMPORTANT: Every single hashtag MUST include the # symbol (e.g. #AI #BuildInPublic). Never omit the # prefix.`,

      instagram: `Create a complete Instagram content package. Format your output with these clearly labeled sections:

**🎯 CONCEPT**
One-line description of the post angle/idea.

**📸 CAROUSEL BREAKDOWN** (if the content suits a carousel)
Slide-by-slide breakdown:
- Slide 1: Hook slide (what makes them stop scrolling)
- Slides 2-7: Key points, one per slide, with suggested text for each
- Final slide: CTA slide
If it's better as a single image or reel, say so and adjust.

**💬 CAPTION**
Start with a strong hook line. Use line breaks for readability. Tell a mini-story or share a lesson. Use emojis sparingly — only where natural. End with a question or CTA to drive comments.

**📣 CTA**
Specific call-to-action for both the caption and the last slide/end of reel.

**#️⃣ HASHTAGS**
15-20 relevant hashtags in a separate block. Mix of large (1M+), medium (100K-1M), and niche (<100K) tags.`,

      pinterest: `Create a complete Pinterest content package. Format your output with these clearly labeled sections:

**📌 PIN TITLE**
SEO-optimized title, 40-100 characters. Front-load keywords. Make it descriptive and searchable.

**📝 PIN DESCRIPTION**
2-3 sentences, keyword-rich but natural. Include relevant search terms people would use to find this content. End with a CTA.

**🏷️ BOARD SUGGESTION**
Which Pinterest board this should go on (suggest a board name and 2-3 related boards).

**🔍 KEYWORDS**
10-15 SEO keywords/phrases someone might search to find this pin. Format as a numbered list (1. keyword, 2. keyword, etc.).

**💡 PIN DESIGN NOTES**
Suggest what the pin image should include — text overlay, layout style, colors that would work.`,

      linkedin: `Create a complete LinkedIn content package. Format your output with these clearly labeled sections:

**🎯 ANGLE**
One-line description of the post's core insight or take.

**📝 POST**
Write the full LinkedIn post:
- Open with a bold, counterintuitive, or thought-provoking first line (this is what shows before "see more")
- Use short paragraphs (1-2 sentences each)
- Include a personal story or specific example — not generic advice
- End with a question that drives meaningful comments
- Keep it under 1300 characters for optimal reach
- No hashtags unless truly relevant (max 3, at the very end)

**💬 FIRST COMMENT**
Write a follow-up comment Joey should post immediately after publishing. This should add extra value, context, or a resource link. LinkedIn's algorithm boosts posts with early comments.

**📣 ENGAGEMENT STRATEGY**
2-3 specific actions to boost reach: who to tag, which posts to engage with before/after posting, best time to post.`,
      youtube: `Create a complete YouTube content idea package. Format your output with these clearly labeled sections:

**🎬 VIDEO CONCEPT**
One-line description of the video idea. What's the angle that makes this worth watching?

**📋 TITLE OPTIONS**
3 title options optimized for YouTube search and clicks. Each should:
- Be under 60 characters
- Front-load the keyword
- Create curiosity without being clickbait
- Include a number, question, or power word where natural

**📝 DESCRIPTION**
Write the full YouTube description:
- First 2 lines are the hook (visible before "show more") — make them count
- Key timestamps placeholder (00:00 format)
- 2-3 relevant links (Joey's socials, tools mentioned)
- Brief summary of what the video covers

**🏷️ TAGS**
15-20 YouTube tags. Mix broad (AI, coding) with specific (tool names, techniques). Format as comma-separated list.

**📸 THUMBNAIL CONCEPT**
Describe the ideal thumbnail:
- Text overlay (3-5 words max, high contrast)
- Visual composition (face + screen? Before/after? Tool logo?)
- Color scheme and mood

**📜 SCRIPT OUTLINE**
A structured outline for a 5-10 minute video:
- **Hook** (0:00-0:30): What grabs attention in the first 30 seconds
- **Setup** (0:30-1:30): Context — why this matters
- **Main Content** (1:30-7:00): 3-5 key sections with talking points
- **Results/Demo** (7:00-8:30): Show the outcome
- **CTA** (8:30-9:00): Subscribe, comment prompt, next video tease

**📣 ENGAGEMENT STRATEGY**
- Best posting day/time for this niche
- Community tab post to build anticipation
- Suggested end screen and cards
- Comment pinning strategy`,
    };
    return `${base}\n\n${platformGuides[platform || "linkedin"] || platformGuides.linkedin}`;
  }

  if (outputFormat === "blog") {
    return `${base}\n\nWrite a full, professionally formatted blog article in markdown. This should look like a polished, published article — not a rough draft.

You have access to web search — USE IT to research the topic, find current data, statistics, recent developments, and real examples. Cite your sources naturally within the article (e.g., "According to [source]..." or link inline). This makes the content authoritative and trustworthy.

## Research Guidelines
- Search for recent news, stats, and developments related to the topic
- Find real examples, case studies, or tools to reference
- Verify any claims with current data
- Include 2-4 inline citations or references naturally in the text
- Do NOT fabricate statistics or sources

## Structure & Formatting

**Title** — H1 (#). Specific, compelling, not clickbait. Should make someone want to read.

**Hero subtitle** — One italic line below the title that summarizes the article's promise.

**Intro** — 2-3 punchy sentences that hook the reader. State exactly what they'll learn or gain.

**Body** — Well-structured sections with H2 (##) and H3 (###) headers. Each section should:
- Teach something specific with real examples
- Use short paragraphs (2-3 sentences max)
- Include **bold** for key terms and emphasis
- Use numbered lists for steps/processes
- Use bullet lists for features/benefits
- Include code snippets with language tags if relevant
- Include blockquotes (>) for key insights or memorable quotes

**Illustration placeholders** — After each major section (H2), include an image placeholder in this exact format:
![Description of illustration](ILLUSTRATION:keyword-phrase)

Use descriptive alt text and a keyword phrase that describes the ideal illustration. Examples:
![Workflow diagram showing content flowing from idea to published post](ILLUSTRATION:content-workflow-diagram)
![Screenshot of AI tool generating social media captions](ILLUSTRATION:ai-content-generation-tool)

Include 3-5 illustration placeholders throughout the article at natural visual break points.

**Callout boxes** — Use blockquotes with emoji prefixes for different callout types:
> 💡 **Pro tip:** for tips and tricks
> ⚠️ **Watch out:** for warnings or common mistakes
> 🔑 **Key takeaway:** for crucial points

**Key Takeaways** — A clean summary section with bullet points recapping the main lessons.

**Conclusion** — Brief wrap-up with a specific CTA (follow on TikTok/Instagram, try it yourself, drop a comment).

**Author bio line** — End with a short separator (---) and a one-line author note like: *Joey Colley builds apps with AI and shares the journey on [TikTok](https://www.tiktok.com/@buildaiwithjoey) and [Instagram](https://www.instagram.com/gobuildai).*

## Voice & Style
- Conversational, practical, real — like explaining to a friend
- Short sentences. Punch. No corporate jargon.
- Joey's personal experience woven throughout
- Aim for 1000-2000 words
- No fluff, no filler, every sentence earns its place`;
  }

  if (outputFormat === "video") {
    return `${base}\n\nCreate a complete AI video production prompt package for a 15-30 second short-form video (TikTok/Reels/Shorts). Format with these clearly labeled sections:

**🎬 VIDEO CONCEPT**
One-line description of the video idea. What's the hook? What makes someone stop scrolling?

**⏱️ DURATION & FORMAT**
Recommended length (15s, 30s, or 60s) and format (talking head, b-roll montage, screen recording, animated explainer, cinematic, etc.)

**📜 SCENE-BY-SCENE BREAKDOWN**
Break the video into 3-6 scenes. For each scene:
- **Scene [N]** (X seconds):
  - **Visual:** Exactly what's on screen — camera angle, movement, subject, background, lighting, mood
  - **Text overlay:** Any on-screen text or captions
  - **Audio:** Voiceover line, music mood, or sound effect
  - **Transition:** How it cuts/transitions to the next scene

**🎤 VOICEOVER SCRIPT**
The complete narration script, timed to match each scene. Write it exactly as it should be spoken — casual, punchy, Joey's voice. Include [pause] markers and emphasis with *asterisks*.

**🎵 MUSIC & SOUND**
- Recommended music mood/genre (e.g., "lo-fi chill beat", "energetic electronic", "cinematic tension build")
- Specific sound effects needed (whoosh, notification ding, typing sounds, etc.)
- Trending audio suggestions if applicable

**📝 ON-SCREEN TEXT**
List all text overlays in order with timing:
1. (0-3s) "Hook text here"
2. (4-8s) "Key point"
etc.

**🤖 AI VIDEO GENERATION PROMPT**
Write a single, detailed prompt optimized for AI video tools (Sora, Veo, Invideo, etc.). Include:
- Visual style (cinematic, documentary, animated, etc.)
- Color grading (warm, cool, high contrast, etc.)
- Camera movements (pan, zoom, tracking, static)
- Mood and atmosphere
- Aspect ratio (9:16 for shorts)

**💬 CAPTION & HASHTAGS**
Post caption and 5-8 relevant hashtags for when the video is published.

**📌 PRODUCTION NOTES**
Any tips for making this video perform well — best posting times, trending formats to reference, or ways to make it feel authentic rather than AI-generated.`;
  }

  if (outputFormat === "thread") {
    return `${base}\n\nWrite an X (Twitter) thread. Format it as:

**1/** The hook tweet. This is EVERYTHING — it must create enough curiosity to make someone click "Show this thread." Use a bold claim, surprising stat, or contrarian take. Under 280 characters.

**2/-8/** The body tweets. Each one should:
- Make a single clear point
- Be under 280 characters
- Be readable standalone (someone might screenshot just one)
- Flow naturally from the previous tweet
- Use line breaks within tweets for readability

**9/ or 10/** The closer. Summarize the key lesson, then add a clear CTA (follow for more, bookmark this, drop a comment).

After the thread, add:

**📌 QUOTE TWEET**
Write a short quote-tweet Joey can use to re-share the thread later for more reach.

Aim for 8-12 tweets total. The thread should tell a complete story or teach something specific from start to finish.`;
  }

  return base;
}

// Derivative prompt — takes blog content and reformats for a specific platform/format
function getDerivativePrompt(outputFormat: string, platform?: string): string {
  const base =
    "You are reformatting an existing blog article into a different content format. The blog has already been researched and written — your job is to distill and reformat it, NOT to add new information. Keep Joey Colley's authentic voice: conversational, slightly irreverent, anti-corporate-slop, short sentences." + ANTI_SLOP_DIRECTIVE;

  if (outputFormat === "social") {
    const guides: Record<string, string> = {
      tiktok: "Distill this blog into a TikTok content package: HOOK (3s opener, 2-3 options), SCRIPT (30-60s talking head), CAPTION, CTA, and HASHTAGS (5-8). Pull the most compelling insight from the blog as the hook.",
      instagram: "Distill this blog into an Instagram package: CONCEPT, CAROUSEL BREAKDOWN (hook slide + 5-7 key points + CTA slide), CAPTION (hook line, mini-story, question CTA), and HASHTAGS (15-20 mixed reach).",
      pinterest: "Distill this blog into a Pinterest package: PIN TITLE (SEO, 40-100 chars), DESCRIPTION (2-3 sentences, keyword-rich), BOARD SUGGESTION, KEYWORDS (10-15), and PIN DESIGN NOTES.",
      linkedin: "Distill this blog into a LinkedIn post: ANGLE (one-line), POST (bold opener, short paragraphs, personal story, question CTA, under 1300 chars), FIRST COMMENT (extra value), and ENGAGEMENT STRATEGY.",
      youtube: "Distill this blog into a YouTube content idea package: VIDEO CONCEPT, 3 TITLE OPTIONS (under 60 chars, SEO-optimized), DESCRIPTION (hook + timestamps + links), TAGS (15-20), THUMBNAIL CONCEPT, SCRIPT OUTLINE (hook, setup, 3-5 main sections, results, CTA for 5-10 min video), and ENGAGEMENT STRATEGY.",
    };
    return `${base}\n\n${guides[platform || "linkedin"] || guides.linkedin}`;
  }

  if (outputFormat === "thread") {
    return `${base}\n\nDistill this blog into an X (Twitter) thread of 8-12 tweets. Tweet 1 is the hook (bold claim or surprising stat, under 280 chars). Body tweets each make one clear point. Closer has a CTA. Add a QUOTE TWEET for resharing.`;
  }

  if (outputFormat === "video") {
    return `${base}\n\nDistill this blog into a short-form video production package (15-30s): VIDEO CONCEPT, DURATION & FORMAT, SCENE-BY-SCENE BREAKDOWN (3-6 scenes with visuals/text/audio/transitions), VOICEOVER SCRIPT, MUSIC & SOUND, ON-SCREEN TEXT with timing, AI VIDEO GENERATION PROMPT, CAPTION & HASHTAGS, PRODUCTION NOTES.`;
  }

  return base;
}

async function checkDailyLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; used: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await adminClient
    .from("content_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  const used = count || 0;
  return { allowed: used < DAILY_GENERATION_LIMIT, used };
}

async function callAnthropic(params: {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  userMessage: string;
  useWebSearch: boolean;
  maxWebSearches: number;
}): Promise<{ content: string; usage: { input_tokens: number; output_tokens: number }; webSearchesUsed: boolean }> {
  const tools: Record<string, unknown>[] = [];

  // Add web search tool only when requested (blog posts)
  if (params.useWebSearch) {
    tools.push({
      type: "web_search_20250305",
      name: "web_search",
      max_uses: params.maxWebSearches,
    });
  }

  // Messages accumulate across pause_turn continuations
  let messages: Record<string, unknown>[] = [
    {
      role: "user",
      content: params.userMessage,
    },
  ];

  let totalUsage = { input_tokens: 0, output_tokens: 0 };
  let generatedContent = "";
  let webSearchesUsed = false;
  let maxContinuations = 5; // Safety limit for pause_turn loops

  while (maxContinuations > 0) {
    maxContinuations--;

    const body: Record<string, unknown> = {
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages,
    };

    if (tools.length > 0) {
      body.tools = tools;
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errBody);
      throw new Error(`AI generation failed (${anthropicRes.status}): ${errBody.substring(0, 200)}`);
    }

    const aiData = await anthropicRes.json();

    // Accumulate usage
    if (aiData.usage) {
      totalUsage.input_tokens += aiData.usage.input_tokens || 0;
      totalUsage.output_tokens += aiData.usage.output_tokens || 0;
    }

    // Extract text from response blocks
    for (const block of aiData.content || []) {
      if (block.type === "text") {
        generatedContent += block.text;
      } else if (block.type === "web_search_tool_result") {
        webSearchesUsed = true;
      }
    }

    // If stop_reason is pause_turn, continue by sending the response back
    if (aiData.stop_reason === "pause_turn") {
      messages = [
        ...messages,
        { role: "assistant", content: aiData.content },
      ];
      continue;
    }

    // Done — either end_turn or max_tokens
    break;
  }

  if (!generatedContent) {
    generatedContent = "No content generated";
  }

  return {
    content: generatedContent,
    usage: totalUsage,
    webSearchesUsed,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the auth token - check Authorization header first, then apikey
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user using the access token from the request
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth failed:", authError?.message, "Header present:", !!authHeader, "Header prefix:", authHeader?.substring(0, 10));
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check daily limit
    const { allowed, used } = await checkDailyLimit(adminClient, user.id);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: `Daily limit reached (${DAILY_GENERATION_LIMIT} generations). Resets at midnight.`,
          daily_used: used,
          daily_limit: DAILY_GENERATION_LIMIT,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      input_type,
      input_text,
      output_format,
      platform,
      cascade_source,  // If provided, this is blog content to derive from
      use_perplexity,  // Whether to use Perplexity for hashtag research
      all_platforms,   // All selected platforms (for Perplexity query)
      real_time_hashtags, // Pre-researched hashtags from Perplexity (passed from client)
    } = await req.json();

    if (!output_format) {
      return new Response(
        JSON.stringify({ error: "output_format is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine generation mode
    const isCascadeDerivative = !!cascade_source;
    const isBlogWithSearch = output_format === "blog" && !isCascadeDerivative;
    const needsHashtags = (output_format === "social" || output_format === "thread" || output_format === "video") && !isCascadeDerivative;

    // Hashtag data from Perplexity (passed from client-side, already researched)
    const hashtagData: string | null = real_time_hashtags || null;

    // Build hashtag injection for system prompt
    const hashtagInjection = hashtagData
      ? `\n\n## REAL-TIME HASHTAG DATA (from Perplexity research)\nUse these researched hashtags as your PRIMARY source. Select the most relevant ones for this platform and content. Do NOT make up your own hashtags — choose from this list:\n\n${hashtagData}`
      : '';

    // Determine if Claude should also do its own web search
    const useWebSearch = isBlogWithSearch || (needsHashtags && !hashtagData);

    let model: string;
    let maxTokens: number;
    let systemPrompt: string;
    let userMessage: string;

    if (isCascadeDerivative) {
      // Derivative mode: cheap model, reformatting blog content
      model = MODELS.derivative;
      maxTokens = MAX_TOKENS_DERIVATIVE;
      systemPrompt = getDerivativePrompt(output_format, platform) + hashtagInjection;
      userMessage = `Here is the blog article to distill:\n\n${cascade_source}\n\nReformat this into the requested format. Stay faithful to the blog's content and insights.`;
    } else if (isBlogWithSearch) {
      // Blog mode: research model with web search
      model = MODELS.research;
      maxTokens = MAX_TOKENS_BLOG;
      systemPrompt = getSystemPrompt(output_format, platform);
      userMessage = `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nResearch this topic using web search, then write a comprehensive blog article with real data and citations.`;
    } else if (needsHashtags) {
      // Social/thread/video mode
      model = MODELS.standard;
      maxTokens = MAX_TOKENS_STANDARD;
      systemPrompt = getSystemPrompt(output_format, platform) + hashtagInjection;
      userMessage = hashtagData
        ? `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nTransform this into the requested format. Use the real-time hashtag data provided in the system prompt — select the most relevant hashtags from that researched list.`
        : `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nTransform this into the requested format. IMPORTANT: Before generating hashtags, use web search to find currently trending and high-performing hashtags for this topic on ${platform || 'social media'}. Search for recent hashtag trends and engagement data.`;
    } else {
      // Standard mode: direct generation without web search
      model = MODELS.standard;
      maxTokens = MAX_TOKENS_STANDARD;
      systemPrompt = getSystemPrompt(output_format, platform);
      userMessage = `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nTransform this into the requested format.`;
    }

    const result = await callAnthropic({
      model,
      maxTokens,
      systemPrompt,
      userMessage,
      useWebSearch,
      maxWebSearches: MAX_WEB_SEARCHES,
    });

    // Save to database with usage tracking
    await adminClient.from("content_generations").insert({
      user_id: user.id,
      input_type: isCascadeDerivative ? (input_type || "text") : input_type,
      input_text: isCascadeDerivative ? `[Derived from blog] ${(cascade_source as string).substring(0, 200)}...` : input_text,
      output_format,
      platform: platform || null,
      generated_content: result.content,
    });

    // Log activity metadata (privacy-safe — no content)
    await adminClient.from("activity_log").insert({
      user_id: user.id,
      action: "content_generation",
      metadata: {
        input_type: isCascadeDerivative ? (input_type || "text") : input_type,
        output_format,
        platform: platform || null,
        cascade: isCascadeDerivative,
      },
    });

    return new Response(
      JSON.stringify({
        content: result.content,
        usage: {
          input_tokens: result.usage.input_tokens,
          output_tokens: result.usage.output_tokens,
          model,
          web_search_used: result.webSearchesUsed,
        },
        limits: {
          daily_used: used + 1,
          daily_limit: DAILY_GENERATION_LIMIT,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
