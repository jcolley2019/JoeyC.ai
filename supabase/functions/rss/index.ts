import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../_shared/env.ts";

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");

const SITE_URL = "https://www.joeyc.ai";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, content, published_at, tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const lastBuildDate = posts?.[0]?.published_at
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString();

  const items = (posts || []).map((post) => {
    const pubDate = post.published_at
      ? new Date(post.published_at).toUTCString()
      : new Date().toUTCString();

    const categories = (post.tags || [])
      .map((tag: string) => `      <category>${escapeXml(tag)}</category>`)
      .join("\n");

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <pubDate>${pubDate}</pubDate>
      <author>joey@joeyc.ai (Joey Colley)</author>
${categories}
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>JoeyC.ai Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>AI experiments, build logs, and lessons learned — by Joey Colley.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/photos/joey-og.jpg</url>
      <title>JoeyC.ai Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
