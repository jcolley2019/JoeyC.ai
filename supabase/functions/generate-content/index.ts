import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { corsHeadersFor } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { validateRequest } from "./validate.ts";
import { voiceBlock, type BrandVoice } from "./voice.ts";

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Model tiers — Sonnet 5 for research-heavy blog and direct generation, Haiku 4.5 for derivatives
const MODELS = {
  research: "claude-sonnet-5",             // Blog posts with web search
  standard: "claude-sonnet-5",             // Direct generation (non-cascade)
  derivative: "claude-haiku-4-5-20251001", // Cheap reformatting from blog content
};

// Anthropic list prices in USD per million tokens, from
// https://platform.claude.com/docs/en/about-claude/pricing (read 2026-09-24):
//   Claude Sonnet 5   input $2    5-minute cache write $2.50  cache hit $0.20  output $10
//   Claude Haiku 4.5  input $1    5-minute cache write $1.25  cache hit $0.10  output $5
//   Web search        $10 per 1,000 searches, on top of tokens
// The Studio's cost line is computed here from these numbers; the client has no price table.
const MODEL_PRICING: Record<string, { input: number; cacheWrite: number; cacheRead: number; output: number }> = {
  "claude-sonnet-5": { input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 10 },
  "claude-haiku-4-5-20251001": { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
};
const WEB_SEARCH_USD_PER_REQUEST = 10 / 1000;

// Cost controls
const MAX_WEB_SEARCHES = 5;       // Max web search invocations per blog post
const MAX_TOKENS_BLOG = 8192;     // Blog generation (long-form, 2000+ words)
const MAX_TOKENS_DERIVATIVE = 2048; // Social/thread derivatives (shorter output)
const MAX_TOKENS_STANDARD = 4096;  // Non-cascade generation
const DAILY_GENERATION_LIMIT = 50; // Per user per UTC day, counted per batch; keep in sync with reserve_generation()
// Supabase kills an edge function at 400 s wall clock. Stop the model well
// before that, so the quota row is released and the Studio is told why.
const GENERATION_DEADLINE_MS = 300_000;
const GENERATION_TIMEOUT_MESSAGE =
  "The research took too long and was stopped. This did not count toward your daily limit. Try again in a minute.";
// Text written before a tool call ("I'll research…", "Hitting a rate limit…")
// is held back this long; past it, the text is taken to be the article.
const NARRATION_MAX_CHARS = 600;

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

// Format instructions are identical for every user and go first in the system
// prompt, so the prompt cache can reuse them. Whose voice to write in comes
// from voiceBlock() (voice.ts) and is appended after them as the AUTHOR section.
const FORMAT_PREAMBLE =
  "You are a content creation assistant. The AUTHOR section at the end of these instructions says whose voice you write in; \"the author\" below always means that person.";

function getSystemPrompt(
  outputFormat: string,
  platform?: string,
): string {
  const base = FORMAT_PREAMBLE + ANTI_SLOP_DIRECTIVE;

  if (outputFormat === "social") {
    const platformGuides: Record<string, string> = {
      tiktok: `Create a complete TikTok content package. Format your output with these clearly labeled sections:

**🎬 HOOK (first 3 seconds)**
Write the exact opening line/action that stops the scroll. This is the most important part — it should create curiosity or make a bold claim. Write 2-3 hook options.

**📝 SCRIPT**
Write a full talking-head script, 30-60 seconds worth. Use short punchy sentences. Include stage directions in [brackets] like [show screen] or [cut to demo]. Write it exactly how the author would say it out loud — casual, real, no corporate speak.

**💬 CAPTION**
Write the post caption. Keep it punchy with line breaks. Conversational tone.

**📣 CTA (call to action)**
What the author tells viewers to do at the end of the video AND in the caption. Make it specific and actionable.

**#️⃣ HASHTAGS**
5-8 relevant hashtags. Mix trending and niche. IMPORTANT: Every single hashtag MUST include the # symbol (e.g. #AI #BuildInPublic). Never omit the # prefix.

**⏰ BEST TIME TO POST:** Tuesday–Thursday, 10am–12pm or 7pm–9pm EST (highest TikTok engagement window for tech/education niche)`,

      instagram: `Create a complete Instagram content package. Format your output with these clearly labeled sections:

**🎯 CONCEPT**
One-line description of the post angle/idea. Specify the best format: Carousel, Single Image, or Reel.

**📸 CAROUSEL BREAKDOWN** (if the content suits a carousel)
Slide-by-slide breakdown:
- Slide 1: Hook slide (what makes them stop scrolling)
- Slides 2-7: Key points, one per slide, with suggested text for each
- Final slide: CTA slide
If it's better as a single image or reel, say so and adjust.

**🎬 REEL VERSION** (always include this section)
A short-form vertical video version of this content:
- **Hook** (first 1-2 seconds): Text overlay or opening line that stops the scroll
- **Script** (15-30 seconds): Quick talking-head or screen-share script. Punchy, fast-paced. No filler.
- **Text overlays**: 2-3 key text overlays to add during editing
- **Trending audio suggestion**: Suggest a style of trending audio (e.g. "use a trending motivational voiceover" or "trending lo-fi beat")
- **Cover image text**: What text should appear on the Reel's cover/thumbnail in the grid

**💬 CAPTION**
Start with a strong hook line. Use line breaks for readability. Tell a mini-story or share a lesson. Use emojis sparingly — only where natural. End with a question or CTA to drive comments.

**📣 CTA**
Specific call-to-action for both the caption and the last slide/end of reel.

**#️⃣ HASHTAGS**
15-20 relevant hashtags in a separate block. Mix of large (1M+), medium (100K-1M), and niche (<100K) tags.

**⏰ BEST TIME TO POST:** Monday–Friday, 11am–1pm or 7pm–9pm EST (Instagram peak for Reels and carousels in tech/creator niche)`,

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
Suggest what the pin image should include — text overlay, layout style, colors that would work.

**⏰ BEST TIME TO PIN:** Saturday–Sunday 8pm–11pm EST, or Friday 3pm–5pm EST (Pinterest peak discovery hours)`,

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
Write a follow-up comment the author should post immediately after publishing. This should add extra value, context, or a resource link. LinkedIn's algorithm boosts posts with early comments.

**📣 ENGAGEMENT STRATEGY**
2-3 specific actions to boost reach: who to tag, which posts to engage with before/after posting, best time to post.

**⏰ BEST TIME TO POST:** Tuesday–Thursday, 8am–10am or 12pm–1pm EST (LinkedIn peak for B2B/tech content)`,
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
- 2-3 relevant links (the author's socials, tools mentioned)
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

**⚡ YOUTUBE SHORTS VERSION**
A vertical short-form version (under 60 seconds) derived from the main video:
- **Hook** (0-3s): One punchy line or visual that stops the scroll
- **Script** (15-45s): The single most interesting takeaway from the full video, condensed into a fast-paced talking-head or screen-share clip
- **Text overlays**: 2-3 bold text overlays for key moments
- **Title**: Short-optimized title (different from the long-form title — more casual, curiosity-driven)
- **#Shorts tag**: Always include #Shorts in the description

**📣 ENGAGEMENT STRATEGY**
- Best posting day/time for this niche
- Community tab post to build anticipation
- Suggested end screen and cards
- Comment pinning strategy

**⏰ BEST TIME TO POST:** Friday–Saturday 9am–11am EST, or Wednesday 3pm–5pm EST (YouTube peak for tech/tutorial content). For Shorts: post daily or every other day, any time (Shorts have a longer discovery tail).`,
    };
    return `${base}\n\n${platformGuides[platform || "linkedin"] || platformGuides.linkedin}`;
  }

  if (outputFormat === "blog") {
    const blogPrompt = `${base}\n\nWrite a full, professionally formatted blog article in markdown. This should look like a polished, published article — not a rough draft.

You have access to web search — USE IT to research the topic, find current data, statistics, recent developments, and real examples. Cite your sources naturally within the article (e.g., "According to [source]..." or link inline). This makes the content authoritative and trustworthy.

## Research Guidelines
- Search for recent news, stats, and developments related to the topic
- Find real examples, case studies, or tools to reference
- Verify any claims with current data
- Include 2-4 inline citations or references naturally in the text
- Do NOT fabricate statistics or sources

## SEO Requirements — MANDATORY
Before writing, identify a **primary keyword** (the main search term someone would Google to find this article). Then:
- Include the primary keyword in the H1 title (naturally, not forced)
- Use it in the first paragraph
- Work it into 2-3 H2/H3 headers
- Sprinkle it naturally throughout the body (don't keyword-stuff)
- Optimize the title for **search intent** — what would someone type into Google? Lead with that.

**OUTPUT THE FOLLOWING AT THE VERY TOP, before the article:**

\`\`\`meta
Primary Keyword: [the keyword you chose]
Meta Description: [150-160 character SEO description for search engines — compelling, includes the primary keyword, makes someone want to click]
\`\`\`

Then write the full article below.

## Structure & Formatting

**Title** — H1 (#). Optimized for search intent AND compelling to read. Include the primary keyword naturally. Not clickbait, but specific enough that Google understands the topic.

**Hero subtitle** — One italic line below the title that summarizes the article's promise.

**Intro** — 2-3 punchy sentences that hook the reader. Include the primary keyword naturally. State exactly what they'll learn or gain.

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

**FAQ Section** — Add a "## Frequently Asked Questions" section with 3-5 Q&As in "People Also Ask" style. These should be real questions someone would search for related to this topic. Format each as:
### Q: [Question]
[2-3 sentence answer — direct, useful, includes relevant keywords naturally]

**Conclusion** — Brief wrap-up with a specific CTA (follow on TikTok/Instagram, try it yourself, drop a comment).

**Author bio line** — End with a short separator (---) and the author sign-off from the AUTHOR section, verbatim.

## Voice & Style
- Conversational, practical, real — like explaining to a friend
- Short sentences. Punch. No corporate jargon.
- The author's personal experience woven throughout
- Aim for 1500-2500 words
- No fluff, no filler, every sentence earns its place`

    return blogPrompt;
  }

  if (outputFormat === "video") {
    return `${base}\n\nCRITICAL INSTRUCTION: You MUST generate a complete separate prompt section for EVERY platform listed in the metadata. If the metadata says platforms are TikTok, Instagram, Pinterest — you MUST output ALL THREE sections. Do not stop after one or two. Every platform gets its own full prompt.

Use EXACTLY this separator format between platforms:
=== TIKTOK ===
[full TikTok prompt here]
=== INSTAGRAM ===
[full Instagram prompt here]
=== PINTEREST ===
[full Pinterest prompt here]

Never skip a platform. Never combine platforms. One section per platform, every time.

You are an expert AI media prompt engineer. Generate a highly optimized prompt for the specified AI platform.

The user's input will include metadata at the end with:
- Media type (video or image)
- AI Platform (the specific tool to optimize for)
- Aspect Ratios (target dimensions for each social platform)

PLATFORM-SPECIFIC GUIDELINES:

VIDEO PLATFORMS:
VEO 3: Include camera movement, lighting, audio descriptions (Veo 3 supports audio), cinematic language, shot type, subject, action, setting, mood.
SORA 2: Highly detailed scene descriptions, physics and realistic motion, time of day, weather, environment, character consistency, world-building.
KLING AI: Cinematic quality, specific camera angles, motion speed (slow-mo, time-lapse), color grading style, negative prompts (what to avoid).
HIGGSFIELD: Human motion and performance, body language, facial expressions, wardrobe, styling, environment, great for lifestyle/social content.
SEEDANCE: Artistic and stylized content, art style references, color palette, visual mood, motion style.
RUNWAY: Cinematic generation, detailed scene composition, motion brush directions, camera path descriptions, style references.
PIKA: Short-form motion, style transfer, text-to-video with specific motion descriptions, aspect ratio optimization.
HAILUO: Realistic human motion, natural expressions, detailed scene descriptions, lighting and atmosphere.

IMAGE PLATFORMS:
MIDJOURNEY: Use :: weighting, --ar {ratio}, --v 6.1, --style raw for photorealistic, descriptive artistic style references, lighting, mood, composition. Format: [subject], [style], [lighting], [mood], [camera/lens if photo], --ar {ratio} --v 6.1
DALL-E 3 / CHATGPT: Natural language descriptions, very detailed, mention style explicitly (photorealistic, illustration, oil painting), include composition and mood.
FLUX: Highly detailed technical descriptions, supports complex scenes, mention "professional photography" or art style, include technical camera details for photos.
IDEOGRAM: Great for text in images, mention typography style, very good at logos and graphics, use clear composition descriptions.
FIREFLY (Adobe): Style references, mood boards, commercial-safe descriptions, great for professional/marketing imagery.
STABLE DIFFUSION: Detailed positive and negative prompts, model-specific keywords (photorealistic, cinematic, 8k), CFG scale suggestions, sampler recommendations.
NANO BANANA: Optimized natural language descriptions, style references, composition details.

FORMAT YOUR OUTPUT — for EACH platform, output this structure:

=== [PLATFORM NAME IN CAPS] ===

🎬 [VIDEO/IMAGE] PROMPT FOR [AI PLATFORM]
📐 Aspect Ratio: [ratio for this specific platform]
🌐 Optimized for: [this platform]

📋 OPTIMIZED PROMPT:
[Full detailed prompt ready to paste into the AI tool]

💡 PRO TIPS FOR [AI PLATFORM]:
- [Tip 1 specific to this platform]
- [Tip 2]
- [Tip 3]

⚙️ RECOMMENDED SETTINGS:
- Aspect Ratio: [specific ratio]
- [Platform-specific settings like --v 6.1, CFG scale, etc.]

Repeat for EVERY platform in the metadata. If no specific AI platform or media type is provided in the metadata, fall back to a general-purpose video production prompt with scene-by-scene breakdown, voiceover script, and caption/hashtags.`;
  }

  if (outputFormat === "thread") {
    return `${base}\n\nWrite an X (Twitter) thread. Format it as:

**1/** The hook tweet. This is EVERYTHING — it must create enough curiosity to make someone click "Show this thread." Use a bold claim, surprising stat, or contrarian take. Under 280 characters. Include 1-2 relevant hashtags if they fit naturally (e.g. #AI #BuildInPublic).

**2/-8/** The body tweets. Each one should:
- Make a single clear point
- Be under 280 characters
- Be readable standalone (someone might screenshot just one)
- Flow naturally from the previous tweet
- Use line breaks within tweets for readability

**9/ or 10/** The closer. Summarize the key lesson, then add a clear CTA (follow for more, bookmark this, drop a comment). Include 1-3 relevant hashtags in this final tweet for discoverability.

**#️⃣ HASHTAG STRATEGY**
If real-time hashtag data is provided, select the most relevant 2-3 from that list. Otherwise, pick 2-3 hashtags that are currently active on X for this topic. Place them in the hook tweet and/or closer tweet only — never mid-thread. Every hashtag MUST include the # symbol.

After the thread, add:

**📌 QUOTE TWEET**
Write a short quote-tweet the author can use to re-share the thread later for more reach.

Aim for 8-12 tweets total. The thread should tell a complete story or teach something specific from start to finish.

**⏰ BEST TIME TO POST:** Monday–Wednesday, 9am–11am or 12pm–1pm EST (X peak engagement for tech/AI content)`;
  }

  return base;
}

// Derivative prompt — takes blog content and reformats for a specific platform/format
function getDerivativePrompt(outputFormat: string, platform?: string): string {
  const base =
    "You are reformatting an existing blog article into a different content format. The blog has already been researched and written — your job is to distill and reformat it, NOT to add new information. Keep the author's voice, described in the AUTHOR section at the end of these instructions." + ANTI_SLOP_DIRECTIVE;

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
    return `${base}\n\nDistill this blog into an AI-optimized image or video prompt. Check the user input for metadata (Media type, AI Platform, Aspect Ratios). If present, generate a platform-specific prompt optimized for that tool. If no metadata, create a general video production prompt with scene breakdown and voiceover script.`;
  }

  return base;
}

// ── Daily quota (JCAI-FIX-06/C1) ───────────────────────────────────────
// One unit per Studio button press ("batch"), reserved atomically by the
// public.reserve_generation() Postgres function — see
// supabase/migrations/20260924190000_generation_quota.sql.

type Db = SupabaseClient;

/** Next UTC midnight, when the per-day batch count starts over. */
function nextUtcMidnight(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

type Reservation =
  | { ok: true; used: number }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * userClient MUST carry the caller's JWT: the Postgres function reads
 * auth.uid() and rejects the service role.
 */
async function reserveGeneration(userClient: Db, batchId: string): Promise<Reservation> {
  const { data, error } = await userClient.rpc("reserve_generation", { p_batch_id: batchId });
  if (!error) return { ok: true, used: Number(data) };

  if (error.message === "quota_exceeded") {
    return {
      ok: false,
      status: 429,
      body: {
        error: `Daily limit reached (${DAILY_GENERATION_LIMIT} generations). Resets at 00:00 UTC.`,
        daily_used: DAILY_GENERATION_LIMIT,
        daily_limit: DAILY_GENERATION_LIMIT,
        reset_at: nextUtcMidnight(),
      },
    };
  }
  console.error("reserve_generation failed:", error.message);
  return { ok: false, status: 500, body: { error: "Could not check the daily limit. Try again." } };
}

/** Drop the batch's placeholder so a batch that produced nothing does not count. */
async function releasePending(adminClient: Db, userId: string, batchId: string) {
  const { error } = await adminClient
    .from("content_generations")
    .delete()
    .eq("user_id", userId)
    .eq("batch_id", batchId)
    .eq("output_format", "pending");
  if (error) console.error("release pending failed:", error.message);
}

/**
 * Store a result. The first successful call of a batch turns the placeholder
 * row into the real one; later calls insert. Two calls finishing at once
 * cannot both claim it: the second UPDATE re-checks output_format after the
 * first commits, matches nothing, and falls through to the insert.
 */
async function saveGeneration(adminClient: Db, userId: string, batchId: string, row: Record<string, unknown>) {
  const { data: claimed, error: claimError } = await adminClient
    .from("content_generations")
    .update(row)
    .eq("user_id", userId)
    .eq("batch_id", batchId)
    .eq("output_format", "pending")
    .select("id");
  if (claimError) console.error("claim pending failed:", claimError.message);
  if (claimed && claimed.length > 0) return;

  const { error } = await adminClient
    .from("content_generations")
    .insert({ ...row, user_id: userId, batch_id: batchId });
  if (error) console.error("content_generations insert failed:", error.message);
}

// ── Anthropic calls ────────────────────────────────────────────────────

interface GenerationUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  web_search_requests: number;
}

interface GenerationResult {
  content: string;
  usage: GenerationUsage;
  webSearchesUsed: boolean;
}

type StreamEvent = { type: "text"; text: string } | { type: "searching" };

/** Thrown by callAnthropic when GENERATION_DEADLINE_MS runs out. */
class GenerationTimeout extends Error {
  constructor() {
    super(GENERATION_TIMEOUT_MESSAGE);
  }
}

/**
 * Keeps the model's between-search narration out of the article. Text since
 * the last tool call is held back until either another tool call starts (the
 * held text was narration: dropped) or it grows past NARRATION_MAX_CHARS or
 * the generation ends (it is the article: released, and later text passes
 * straight through until the next tool call). `content` is exactly what was
 * released, so the stored article matches what the Studio streamed.
 *
 * The last "I have enough data, writing now" line has no tool call after it.
 * With `articleStart` (the blog's ```meta fence or # title), text before the
 * first match is dropped too, until the article has started.
 */
class NarrationFilter {
  content = "";
  private held = "";
  private live = false;

  constructor(
    private emit: (text: string) => void = () => {},
    private articleStart?: RegExp,
  ) {}

  text(text: string) {
    if (this.live) return this.release(text);
    this.held += text;
    if (this.held.length > NARRATION_MAX_CHARS) this.flush();
  }

  toolCall() {
    this.held = "";
    this.live = false;
  }

  flush() {
    this.live = true;
    let held = this.held;
    this.held = "";
    const start = !this.content && this.articleStart ? held.search(this.articleStart) : -1;
    if (start > 0) held = held.slice(start);
    if (held) this.release(held);
  }

  private release(text: string) {
    this.content += text;
    this.emit(text);
  }
}

const isToolCall = (blockType: string) => blockType.endsWith("tool_use"); // tool_use, server_tool_use, mcp_tool_use

function costUsd(model: string, u: GenerationUsage): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  const tokens =
    u.input_tokens * p.input +
    u.cache_creation_input_tokens * p.cacheWrite +
    u.cache_read_input_tokens * p.cacheRead +
    u.output_tokens * p.output;
  return tokens / 1_000_000 + u.web_search_requests * WEB_SEARCH_USD_PER_REQUEST;
}

/**
 * One generation, following pause_turn continuations (long web-search turns).
 *
 * `system` is [static format instructions (cache_control), per-user voice],
 * so repeated calls of the same format reuse the cached prefix.
 * With `onEvent` the request is streamed and article text is reported as it
 * arrives; finalMessage() still gives the complete content blocks, which is
 * what a pause_turn continuation has to send back. Either way the text goes
 * through NarrationFilter, and the call is aborted at `deadlineAt`.
 */
async function callAnthropic(params: {
  model: string;
  maxTokens: number;
  system: Anthropic.TextBlockParam[];
  userMessage: string;
  useWebSearch: boolean;
  maxWebSearches: number;
  deadlineAt: number;
  articleStart?: RegExp;
  onEvent?: (e: StreamEvent) => void;
  signal?: AbortSignal;
}): Promise<GenerationResult> {
  const tools: Anthropic.ToolUnion[] = params.useWebSearch
    ? [{ type: "web_search_20260318", name: "web_search", max_uses: params.maxWebSearches }]
    : [];

  // Messages accumulate across pause_turn continuations
  let messages: Anthropic.MessageParam[] = [{ role: "user", content: params.userMessage }];

  const usage: GenerationUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    web_search_requests: 0,
  };
  const onEvent = params.onEvent;
  const filter = new NarrationFilter(onEvent && ((text) => onEvent({ type: "text", text })), params.articleStart);
  let webSearchesUsed = false;
  let maxContinuations = 5; // Safety limit for pause_turn loops

  // One signal for both reasons to stop: the caller went away, or the deadline passed.
  const abort = new AbortController();
  const onCallerAbort = () => abort.abort();
  params.signal?.addEventListener("abort", onCallerAbort, { once: true });
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    abort.abort();
  }, Math.max(0, params.deadlineAt - Date.now()));

  try {
    while (maxContinuations > 0) {
      maxContinuations--;
      if (timedOut) throw new GenerationTimeout();

      const body: Anthropic.MessageCreateParamsNonStreaming = {
        model: params.model,
        max_tokens: params.maxTokens,
        system: params.system,
        messages,
        ...(tools.length > 0 ? { tools } : {}),
        // Sonnet 5 thinks adaptively unless told not to. The prompts and token
        // budgets here were tuned without thinking, so keep it off.
        ...(params.model.startsWith("claude-sonnet") ? { thinking: { type: "disabled" as const } } : {}),
      };

      let message: Anthropic.Message;
      if (onEvent) {
        const stream = anthropic.messages.stream(body, { signal: abort.signal });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            filter.text(event.delta.text);
          } else if (event.type === "content_block_start" && isToolCall(event.content_block.type)) {
            filter.toolCall();
            if (event.content_block.type === "server_tool_use") onEvent({ type: "searching" });
          }
        }
        message = await stream.finalMessage();
      } else {
        message = await anthropic.messages.create(body, { signal: abort.signal });
        for (const block of message.content) {
          if (block.type === "text") filter.text(block.text);
          else if (isToolCall(block.type)) filter.toolCall();
        }
      }

      usage.input_tokens += message.usage.input_tokens || 0;
      usage.output_tokens += message.usage.output_tokens || 0;
      usage.cache_creation_input_tokens += message.usage.cache_creation_input_tokens || 0;
      usage.cache_read_input_tokens += message.usage.cache_read_input_tokens || 0;
      usage.web_search_requests += message.usage.server_tool_use?.web_search_requests || 0;

      for (const block of message.content) {
        if (block.type === "web_search_tool_result") webSearchesUsed = true;
      }

      // If stop_reason is pause_turn, continue by sending the response back.
      // Held text stays held: the continuation may open with another search.
      if (message.stop_reason === "pause_turn") {
        messages = [...messages, { role: "assistant", content: message.content }];
        continue;
      }

      // Done — end_turn, max_tokens or refusal
      break;
    }
  } catch (err) {
    if (timedOut) throw new GenerationTimeout();
    throw err;
  } finally {
    clearTimeout(deadline);
    params.signal?.removeEventListener("abort", onCallerAbort);
  }
  filter.flush();

  return {
    content: filter.content,
    usage,
    webSearchesUsed: webSearchesUsed || usage.web_search_requests > 0,
  };
}

Deno.serve(async (req) => {
  const receivedAt = Date.now();
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Set while this call holds the batch's reservation; released on failure or empty output.
  let reserved: { adminClient: Db; userId: string; batchId: string } | null = null;

  try {
    // Get the auth token - check Authorization header first, then apikey
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No authorization header" }, 401);
    }

    // Verify the user using the access token from the request. The same
    // client carries the user's JWT into reserve_generation().
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth failed:", authError?.message);
      return json({ error: "Unauthorized" }, 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return json({ error: "Request body must be valid JSON" }, 400);
    }
    const validation = validateRequest(rawBody);
    if (!validation.ok) {
      return json({ error: validation.error }, 400);
    }
    const {
      input_type,
      input_text,
      output_format,
      platform,
      cascade_source,  // If provided, this is blog content to derive from
      real_time_hashtags, // Pre-researched hashtags from Perplexity (passed from client)
    } = validation.value;
    // Clients from before JCAI-FIX-06 send no batch_id: each call is then its own batch.
    const batchId = validation.value.batch_id ?? crypto.randomUUID();

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Reserve (or join) this batch's slot in today's quota — atomic in Postgres.
    const reservation = await reserveGeneration(supabase, batchId);
    if (!reservation.ok) {
      return json(reservation.body, reservation.status);
    }
    reserved = { adminClient, userId: user.id, batchId };

    // Brand profile comes from the database, never from the request body (L3-17).
    const { data: brandRow, error: brandError } = await adminClient
      .from("brand_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (brandError) console.error("brand_profiles fetch failed:", brandError.message);
    const voice = voiceBlock(brandRow as BrandVoice | null);

    // Determine generation mode
    const isCascadeDerivative = !!cascade_source;
    const isBlogWithSearch = output_format === "blog" && !isCascadeDerivative;
    const needsHashtags = (output_format === "social" || output_format === "thread") && !isCascadeDerivative;
    const isVideoPrompt = output_format === "video" && !isCascadeDerivative;

    // Hashtag data from Perplexity (passed from client-side, already researched)
    const hashtagData: string | null = real_time_hashtags || null;

    // Build hashtag injection for system prompt
    const hashtagInjection = hashtagData
      ? `\n\n## REAL-TIME HASHTAG DATA (from Perplexity research)\nUse these researched hashtags as your PRIMARY source. Select the most relevant ones for this platform and content. Do NOT make up your own hashtags — choose from this list:\n\n${hashtagData}`
      : '';

    // Determine if Claude should also do its own web search
    // Blog: always. Social/thread: always for content accuracy + hashtag fallback.
    const useWebSearch = isBlogWithSearch || needsHashtags || isVideoPrompt;

    let model: string;
    let maxTokens: number;
    let formatPrompt: string; // identical for every user: cached
    let userMessage: string;

    if (isCascadeDerivative) {
      // Derivative mode: cheap model, reformatting blog content
      model = MODELS.derivative;
      maxTokens = MAX_TOKENS_DERIVATIVE;
      formatPrompt = getDerivativePrompt(output_format, platform);
      userMessage = `Here is the blog article to distill:\n\n${cascade_source}\n\nReformat this into the requested format. Stay faithful to the blog's content and insights.`;
    } else if (isBlogWithSearch) {
      // Blog mode: research model with web search
      model = MODELS.research;
      maxTokens = MAX_TOKENS_BLOG;
      formatPrompt = getSystemPrompt(output_format, platform);
      userMessage = `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nResearch this topic using web search, then write a comprehensive blog article with real data and citations.`;
    } else if (needsHashtags) {
      // Social/thread mode: web search for content accuracy AND hashtags
      model = MODELS.standard;
      maxTokens = MAX_TOKENS_STANDARD;
      formatPrompt = getSystemPrompt(output_format, platform);
      userMessage = hashtagData
        ? `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nBefore generating content, use web search to verify any facts, tools, or trends mentioned in the input. Make sure all claims are current and accurate. Then transform this into the requested format. Use the real-time hashtag data provided in the system prompt — select the most relevant hashtags from that researched list.`
        : `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nBefore generating content, use web search to: 1) Verify any facts, tools, or trends mentioned in the input — make sure everything is current and accurate. 2) Find currently trending and high-performing hashtags for this topic on ${platform || 'social media'}. Then transform this into the requested format.`;
    } else if (isVideoPrompt) {
      // Image & Video Prompt mode: web search for accuracy
      model = MODELS.standard;
      maxTokens = MAX_TOKENS_STANDARD;
      formatPrompt = getSystemPrompt(output_format, platform);
      userMessage = `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nUse web search to verify any tools, platforms, or features mentioned. Then generate a platform-optimized prompt based on the metadata provided.`;
    } else {
      // Standard mode: direct generation without web search
      model = MODELS.standard;
      maxTokens = MAX_TOKENS_STANDARD;
      formatPrompt = getSystemPrompt(output_format, platform);
      userMessage = `Here is the raw input (type: ${input_type}):\n\n${input_text}\n\nTransform this into the requested format.`;
    }

    // Static part first so the cache hits; the voice and hashtags vary per user/request.
    const system: Anthropic.TextBlockParam[] = [
      { type: "text", text: formatPrompt, cache_control: { type: "ephemeral" } },
      { type: "text", text: voice + (isVideoPrompt || isBlogWithSearch ? "" : hashtagInjection) },
    ];

    const generation = {
      model,
      maxTokens,
      system,
      userMessage,
      useWebSearch,
      maxWebSearches: MAX_WEB_SEARCHES,
      deadlineAt: receivedAt + GENERATION_DEADLINE_MS,
      // The blog prompt opens the article with a ```meta fence, then the # title.
      articleStart: isBlogWithSearch ? /```meta|^# /m : undefined,
    };

    // Store the result, log it, and build the usage payload the Studio shows.
    const finish = async (result: GenerationResult) => {
      // Empty output is not stored and does not count toward the quota.
      if (!result.content.trim()) {
        await releasePending(adminClient, user.id, batchId);
        return { ok: false as const, error: "The model returned no content. This did not count toward your daily limit." };
      }

      await saveGeneration(adminClient, user.id, batchId, {
        input_type,
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
          input_type,
          output_format,
          platform: platform || null,
          cascade: isCascadeDerivative,
        },
      });

      return {
        ok: true as const,
        payload: {
          usage: {
            ...result.usage,
            model,
            web_search_used: result.webSearchesUsed,
            cost_usd: Number(costUsd(model, result.usage).toFixed(6)),
          },
          web_search_used: result.webSearchesUsed,
          limits: {
            daily_used: reservation.used,
            daily_limit: DAILY_GENERATION_LIMIT,
            reset_at: nextUtcMidnight(),
          },
        },
      };
    };

    // Blog: stream the tokens through as server-sent events (L4-05), so the
    // Studio shows progress and a long research run keeps the connection busy.
    //   event: content_block_delta  {"text": "..."}      per text delta
    //   event: status               {"status": "searching"}
    //   event: done                 {usage, web_search_used, limits}
    //   event: error                {"error": "..."}
    if (isBlogWithSearch) {
      reserved = null; // the stream owns the reservation from here
      const encoder = new TextEncoder();
      const upstream = new AbortController();
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          const write = (chunk: string) => {
            try { controller.enqueue(encoder.encode(chunk)); } catch { /* client went away */ }
          };
          const send = (event: string, data: unknown) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          const keepAlive = setInterval(() => write(": keep-alive\n\n"), 15_000);
          try {
            const result = await callAnthropic({
              ...generation,
              signal: upstream.signal,
              onEvent: (e) => e.type === "text" ? send("content_block_delta", { text: e.text }) : send("status", { status: "searching" }),
            });
            const outcome = await finish(result);
            if (outcome.ok) send("done", outcome.payload);
            else send("error", { error: outcome.error });
          } catch (err) {
            console.error("Blog stream error:", err);
            // Timeout included: nothing was stored, so the press does not count.
            await releasePending(adminClient, user.id, batchId);
            send("error", { error: err instanceof Error ? err.message : "Generation failed" });
          } finally {
            clearInterval(keepAlive);
            try { controller.close(); } catch { /* already closed */ }
          }
        },
        cancel() {
          // The Studio aborted (unmount or Cancel): stop paying for tokens nobody reads.
          upstream.abort();
        },
      });
      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const result = await callAnthropic(generation);
    const outcome = await finish(result);
    reserved = null;
    if (!outcome.ok) {
      return json({ error: outcome.error }, 502);
    }
    return json({ content: result.content, ...outcome.payload });
  } catch (err) {
    console.error("Error:", err);
    if (reserved) await releasePending(reserved.adminClient, reserved.userId, reserved.batchId);
    return json({ error: err instanceof Error ? err.message : "Internal server error" }, err instanceof GenerationTimeout ? 504 : 500);
  }
});
