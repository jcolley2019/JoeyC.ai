import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://joeyc.ai";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Fetch all published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { url: SITE_URL, changefreq: "weekly", priority: "1.0", lastmod: today },
    { url: `${SITE_URL}/blog`, changefreq: "daily", priority: "0.8", lastmod: today },
  ];

  // Blog post pages
  const blogPages = (posts || []).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
    lastmod: (post.updated_at || post.published_at || today).split("T")[0],
  }));

  const allPages = [...staticPages, ...blogPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
