/**
 * /sitemap.xml, served first-party (was a Supabase edge function). Only real lastmod values,
 * no changefreq/priority, slugs XML-escaped.
 */
import { SITE_URL, getSupabase, escapeXml, isoDate, type VercelRequest, type VercelResponse } from './_shared.js'

interface Row { slug: string; updated_at: string | null; published_at: string | null }

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase()
  let posts: Row[] = []
  if (supabase) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (error) console.error('api/sitemap:', error.message)
    posts = (data ?? []) as Row[]
  }

  const lastmodOf = (p: Row) => isoDate(p.updated_at) ?? isoDate(p.published_at)
  const newest = posts.map(lastmodOf).filter((d): d is string => !!d).sort().slice(-1)[0] ?? null

  const entries: Array<{ loc: string; lastmod: string | null }> = [
    { loc: SITE_URL, lastmod: newest },
    { loc: `${SITE_URL}/blog`, lastmod: newest },
    ...posts.map(p => ({ loc: `${SITE_URL}/blog/${escapeXml(p.slug)}`, lastmod: lastmodOf(p) })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `
    <lastmod>${e.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
