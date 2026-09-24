/**
 * /rss.xml, served first-party (was a Supabase edge function). Adds content:encoded with the
 * rendered post HTML; atom:link self points at /rss.xml.
 */
import { SITE_URL, AUTHOR, getSupabase, renderMarkdown, escapeXml, type VercelRequest, type VercelResponse, type PostRow } from './_shared.js'
import { stripLeadingH1 } from '../src/lib/markdown.js'

const FEED_DESCRIPTION = 'AI experiments, build logs, and lessons learned — by Joey Colley.'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase()
  let posts: PostRow[] = []
  if (supabase) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, content, cover_image, published_at, updated_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)
    if (error) console.error('api/rss:', error.message)
    posts = (data ?? []) as PostRow[]
  }

  const toUtc = (iso: string | null) => (iso ? new Date(iso) : new Date()).toUTCString()
  const lastBuildDate = toUtc(posts[0]?.published_at ?? null)

  const items = await Promise.all(posts.map(async post => {
    const url = `${SITE_URL}/blog/${escapeXml(post.slug)}`
    const html = await renderMarkdown(stripLeadingH1(post.content))
    const categories = (post.tags ?? []).map(tag => `      <category>${escapeXml(tag)}</category>`).join('\n')
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt ?? '')}</description>
      <content:encoded><![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
      <pubDate>${toUtc(post.published_at)}</pubDate>
      <author>joey@joeyc.ai (${AUTHOR})</author>
${categories}
    </item>`
  }))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>JoeyC.ai Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/photos/joey-og.jpg</url>
      <title>JoeyC.ai Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
${items.join('\n')}
  </channel>
</rss>
`
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
