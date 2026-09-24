/**
 * Whose voice the Studio writes in (JCAI-FIX-06/C2, L4-04).
 *
 * The format instructions in index.ts are the same for every user and are sent
 * first so the prompt cache can reuse them; this block is the per-user part
 * and is appended after them. It applies to every format and to cascade
 * derivatives, not only the blog.
 *
 * Without a brand profile (or one with no display name) the owner's original
 * persona and sign-off are used, so the owner's output does not change.
 */

export interface BrandVoice {
  display_name?: string | null;
  title?: string | null; // shown in the Studio as the tagline
  bio?: string | null;
  website_url?: string | null;
  style_preset?: string | null;
  brand_kit_notes?: string | null;
  tiktok_handle?: string | null;
  instagram_handle?: string | null;
  youtube_handle?: string | null;
  pinterest_handle?: string | null;
  linkedin_handle?: string | null;
  /** Extra words this brand never uses; merged with the global banned list. Optional, no column yet. */
  banned_words?: string[] | string | null;
}

// Brand fields are user-supplied and end up in the prompt, so each is capped.
const MAX_FIELD_CHARS = 500;
const MAX_NOTES_CHARS = 2000;

const VOICE_GUIDES: Record<string, string> = {
  modern: "clear, concise, professional — clean and direct",
  luxury: "elegant, aspirational, refined — sophisticated word choices",
  editorial: "authoritative, magazine-style — confident and commanding",
  tech: "direct, data-driven, forward-thinking — sharp and precise",
};

const OWNER_PERSONA =
  "You are a content creation assistant for Joey Colley, a non-traditional AI developer who builds apps with AI tools and documents the journey on social media. Joey's voice is authentic, conversational, slightly irreverent, and anti-corporate-slop. He speaks plainly, uses short sentences, and connects with people who are curious about AI but aren't traditional engineers.";

const OWNER_SIGN_OFF =
  "*Joey Colley builds apps with AI and shares the journey on [TikTok](https://www.tiktok.com/@buildaiwithjoey) and [Instagram](https://www.instagram.com/gobuildai).*";

const clip = (v: unknown, max = MAX_FIELD_CHARS): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const handle = (v: unknown) => clip(v).replace(/^@/, "");

function bannedWords(v: BrandVoice["banned_words"]): string[] {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,\n]/) : [];
  return list.map((w) => clip(w, 60)).filter(Boolean).slice(0, 50);
}

function signOff(brand: BrandVoice, name: string): string {
  const title = clip(brand.title);
  const socials: string[] = [];
  if (handle(brand.tiktok_handle)) socials.push(`[TikTok](https://www.tiktok.com/@${handle(brand.tiktok_handle)})`);
  if (handle(brand.instagram_handle)) socials.push(`[Instagram](https://www.instagram.com/${handle(brand.instagram_handle)})`);
  if (handle(brand.youtube_handle)) socials.push(`[YouTube](https://www.youtube.com/@${handle(brand.youtube_handle)})`);
  if (handle(brand.pinterest_handle)) socials.push(`[Pinterest](https://www.pinterest.com/${handle(brand.pinterest_handle)})`);
  if (handle(brand.linkedin_handle)) socials.push(`[LinkedIn](https://www.linkedin.com/in/${handle(brand.linkedin_handle)})`);

  let text = `**About the Author**\n${name}${title ? ` is a ${title}` : ""}. ${clip(brand.bio)}`.trimEnd();
  if (socials.length) text += `\nFollow: ${socials.join(" | ")}`;
  if (clip(brand.website_url)) text += `\n${clip(brand.website_url)}`;
  return text;
}

export function voiceBlock(brand?: BrandVoice | null): string {
  const name = clip(brand?.display_name, 100);

  if (!brand || !name) {
    return `## AUTHOR — whose voice to write in

${OWNER_PERSONA}

When the instructions above say "the author", they mean Joey.

**Author sign-off** — a blog article ends with a --- separator followed by exactly:
${OWNER_SIGN_OFF}`;
  }

  const title = clip(brand.title);
  const tone = VOICE_GUIDES[clip(brand.style_preset)] || VOICE_GUIDES.modern;
  const lines = [
    `You are a content creation assistant for ${name}${title ? `, ${title}` : ""}. Everything you write is in ${name}'s voice and published under ${name}'s name.`,
  ];
  if (clip(brand.bio)) lines.push(`About ${name}: ${clip(brand.bio)}`);
  lines.push(`Tone: ${tone}.`);
  if (clip(brand.brand_kit_notes, MAX_NOTES_CHARS)) {
    lines.push(`Brand voice notes from ${name} (follow them unless they conflict with the writing rules above):\n${clip(brand.brand_kit_notes, MAX_NOTES_CHARS)}`);
  }
  if (clip(brand.website_url)) lines.push(`Website: ${clip(brand.website_url)}`);
  const extraBanned = bannedWords(brand.banned_words);
  if (extraBanned.length) lines.push(`Also banned for this brand, in addition to the banned words above: ${extraBanned.join(", ")}`);
  lines.push(`When the instructions above say "the author", they mean ${name}.`);

  return `## AUTHOR — whose voice to write in

${lines.join("\n")}

**Author sign-off** — a blog article ends with a --- separator followed by exactly:
${signOff(brand, name)}`;
}
