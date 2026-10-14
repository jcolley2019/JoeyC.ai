/**
 * Prerendered blog: /blog (list) and /blog/:slug (post), rewritten here by vercel.json.
 * Shell, head tags and composition live in api/_prerender.ts (shared with api/contact.ts).
 */
import {
  SITE_URL, SITE_NAME, AUTHOR,
  getSupabase, renderMarkdown, escapeHtml, firstParam,
  type VercelRequest, type VercelResponse, type PostRow,
} from './_shared.js'
import { CACHE_OK, readShell, headTags, compose } from './_prerender.js'
import { stripLeadingH1, readingTimeMinutes } from '../src/lib/markdown.js'
import { BLOG_CTA } from '../src/lib/contactPage.js'

const BLOG_DESCRIPTION = 'AI experiments, build logs, and lessons learned — by Joey Colley.'
const BLOG_OG_IMAGE = `${SITE_URL}/photos/joey-og.jpg`
const CACHE_404 = 'public, s-maxage=60, stale-while-revalidate=600'

// Same markup and classes as the CTA in src/pages/BlogPost.tsx, so the SPA swap is invisible.
const WORK_WITH_ME_CTA = `<aside class="mt-12 rounded-xl border border-border bg-bg-card p-6 md:p-8"><h2 class="text-lg font-bold text-text-primary mb-2">${escapeHtml(BLOG_CTA.heading)}</h2><p class="text-text-secondary text-base leading-relaxed mb-5">${escapeHtml(BLOG_CTA.text)}</p><a href="/contact" class="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-bg hover:bg-primary-hover transition-colors">${escapeHtml(BLOG_CTA.link)}</a></aside>`

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function send(res: VercelResponse, status: number, html: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', status === 200 ? CACHE_OK : CACHE_404)
  res.setHeader('X-Prerender', 'blog')
  res.status(status).send(html)
}

function notFound(res: VercelResponse, shell: string) {
  const head = headTags({
    title: `Not found — ${SITE_NAME}`,
    description: 'This page does not exist.',
    ogType: 'website',
    ogImage: `${SITE_URL}/photos/og-image.png`,
    twitterCard: 'summary_large_image',
    noindex: true,
  })
  const body = `<div class="min-h-screen bg-bg noise-overlay flex flex-col"><main class="flex-1 flex flex-col items-center justify-center px-6 py-32 text-center"><p class="font-mono text-sm text-text-secondary mb-4">404</p><h1 class="text-3xl md:text-4xl font-bold text-text-primary mb-6">This page does not exist</h1><a href="/" class="text-primary hover:underline">Back to the home page</a></main></div>`
  send(res, 404, compose(shell, head, body))
}

async function renderList(res: VercelResponse, shell: string) {
  const supabase = getSupabase()
  if (!supabase) return send(res, 200, shell)

  const { data, error } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, published_at, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) console.error('api/blog list:', error.message)
  const posts = (data ?? []) as Array<Pick<PostRow, 'title' | 'slug' | 'excerpt' | 'published_at' | 'tags'>>

  const head = headTags({
    title: `Blog — ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    canonical: `${SITE_URL}/blog`,
    ogType: 'website',
    ogImage: BLOG_OG_IMAGE,
    twitterCard: 'summary',
  })

  const cards = posts.map(p => `<a href="/blog/${escapeHtml(p.slug)}" class="group block bg-bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all">
          <p class="font-mono text-xs text-text-secondary mb-3">${escapeHtml(formatDate(p.published_at))}</p>
          <h2 class="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-3 leading-snug">${escapeHtml(p.title)}</h2>
          <p class="text-text-secondary text-sm leading-relaxed mb-4">${escapeHtml(p.excerpt ?? '')}</p>
          ${(p.tags ?? []).map(t => `<span class="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary/80 border border-primary/10 mr-1">${escapeHtml(t)}</span>`).join('')}
        </a>`).join('\n        ')

  const body = `<div class="min-h-screen bg-bg noise-overlay"><main><div class="max-w-5xl mx-auto px-6 pt-32 pb-8"><a href="/" class="text-text-secondary text-sm">Back to site</a><p class="section-label mb-4 mt-6">// BLOG</p><h1 class="text-4xl md:text-5xl font-bold mb-4 leading-tight">Thoughts &amp; Builds</h1><p class="text-text-secondary text-lg max-w-xl leading-relaxed">AI experiments, build logs, and lessons learned on the journey from non-traditional dev to building real things with AI.</p></div><div class="max-w-5xl mx-auto px-6 py-12"><div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${cards}
      </div></div></main></div>`
  send(res, 200, compose(shell, head, body))
}

async function renderPost(res: VercelResponse, shell: string, slug: string) {
  const supabase = getSupabase()
  if (!supabase) return send(res, 200, shell)

  const { data, error } = await supabase
    .from('blog_posts')
    // '*' so the page keeps working whether or not the blog_meta migration is applied yet.
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .single()
  if (error || !data) {
    if (error && error.code !== 'PGRST116') console.error('api/blog post:', error.message)
    return notFound(res, shell)
  }
  const post = data as PostRow
  const url = `${SITE_URL}/blog/${post.slug}`
  const description = post.meta_description || post.excerpt || ''
  const ogImage = post.cover_image || BLOG_OG_IMAGE
  const articleMarkdown = stripLeadingH1(post.content)
  const articleHtml = await renderMarkdown(articleMarkdown)
  const minutes = readingTimeMinutes(post.content)

  const head = headTags({
    title: `${post.title} — ${SITE_NAME}`,
    description,
    canonical: url,
    ogType: 'article',
    ogImage,
    twitterCard: post.cover_image ? 'summary_large_image' : 'summary',
    article: { publishedTime: post.published_at, modifiedTime: post.updated_at, tags: post.tags ?? [] },
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: ogImage,
      datePublished: post.published_at ?? undefined,
      dateModified: post.updated_at ?? post.published_at ?? undefined,
      author: { '@type': 'Person', name: AUTHOR, url: SITE_URL },
      publisher: { '@type': 'Person', name: AUTHOR, url: SITE_URL },
    }, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    }],
  })

  const tags = (post.tags ?? []).map(t => `<span class="px-2.5 py-1 rounded-md text-xs font-mono bg-primary/10 text-primary border border-primary/20 mr-2">${escapeHtml(t)}</span>`).join('')
  const cover = post.cover_image
    ? `<div class="max-w-4xl mx-auto px-6 pt-10"><img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" class="w-full rounded-xl border border-border object-cover max-h-[28rem]" /></div>`
    : ''
  const body = `<div class="min-h-screen bg-bg noise-overlay"><main><article><div class="max-w-4xl mx-auto px-6 pt-28 pb-10"><a href="/blog" class="text-text-secondary text-sm">All posts</a><div class="mt-8 mb-6">${tags}</div><h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">${escapeHtml(post.title)}</h1><div class="flex items-center gap-3"><img src="/photos/joey-headshot1.webp" alt="${AUTHOR}" class="w-10 h-10 rounded-full object-cover" /><div><p class="text-sm text-text-primary font-medium">${AUTHOR}</p><p class="text-xs font-mono text-text-secondary"><time datetime="${escapeHtml(post.published_at ?? '')}">${escapeHtml(formatDate(post.published_at))}</time> · ${minutes} min read</p></div></div></div>${cover}<div class="max-w-3xl mx-auto px-6 py-12"><div class="prose-prerender">${articleHtml}</div>${WORK_WITH_ME_CTA}</div></article></main></div>`
  send(res, 200, compose(shell, head, body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const shell = readShell()
  try {
    const slug = firstParam(req.query?.slug)
    if (slug && slug.length <= 200 && /^[a-z0-9-]+$/i.test(slug)) {
      await renderPost(res, shell, slug)
    } else if (slug) {
      notFound(res, shell)
    } else {
      await renderList(res, shell)
    }
  } catch (err) {
    console.error('api/blog failed:', err)
    send(res, 200, shell)
  }
}
