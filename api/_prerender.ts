/**
 * Shared by the prerendered routes (api/blog.ts, api/contact.ts): serve dist/index.html with
 * head tags marked data-prerender and a plain-HTML body in #root, so crawlers and link
 * unfurlers see real content. The SPA replaces #root on mount and main.tsx strips the
 * data-prerender tags before rendering its own <Seo>.
 */
import fs from 'node:fs'
import path from 'node:path'
import { SITE_NAME, AUTHOR, escapeHtml } from './_shared.js'

export const CACHE_OK = 'public, s-maxage=300, stale-while-revalidate=86400'

let shellCache: string | null = null
export function readShell(): string {
  if (shellCache) return shellCache
  try {
    shellCache = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf8')
    return shellCache
  } catch {
    // fall through to the bare shell
  }
  console.error('api: dist/index.html not found; using a bare shell')
  shellCache = '<!doctype html><html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div></body></html>'
  return shellCache
}

export interface HeadInput {
  title: string
  description: string
  canonical?: string
  ogType: 'website' | 'article'
  ogImage: string
  twitterCard: 'summary' | 'summary_large_image'
  noindex?: boolean
  article?: { publishedTime?: string | null; modifiedTime?: string | null; tags?: string[] }
  jsonLd?: Array<Record<string, unknown>>
}

export function headTags(h: HeadInput): string {
  const t: string[] = []
  const meta = (attrs: string) => t.push(`<meta ${attrs} data-prerender />`)
  t.push(`<title data-prerender>${escapeHtml(h.title)}</title>`)
  meta(`name="description" content="${escapeHtml(h.description)}"`)
  if (h.noindex) meta(`name="robots" content="noindex, nofollow"`)
  if (h.canonical) t.push(`<link rel="canonical" href="${escapeHtml(h.canonical)}" data-prerender />`)
  meta(`property="og:type" content="${h.ogType}"`)
  meta(`property="og:title" content="${escapeHtml(h.title)}"`)
  meta(`property="og:description" content="${escapeHtml(h.description)}"`)
  if (h.canonical) meta(`property="og:url" content="${escapeHtml(h.canonical)}"`)
  meta(`property="og:image" content="${escapeHtml(h.ogImage)}"`)
  meta(`property="og:site_name" content="${SITE_NAME}"`)
  if (h.article) {
    meta(`property="article:author" content="${AUTHOR}"`)
    if (h.article.publishedTime) meta(`property="article:published_time" content="${escapeHtml(h.article.publishedTime)}"`)
    if (h.article.modifiedTime) meta(`property="article:modified_time" content="${escapeHtml(h.article.modifiedTime)}"`)
    for (const tag of h.article.tags ?? []) meta(`property="article:tag" content="${escapeHtml(tag)}"`)
  }
  meta(`name="twitter:card" content="${h.twitterCard}"`)
  meta(`name="twitter:title" content="${escapeHtml(h.title)}"`)
  meta(`name="twitter:description" content="${escapeHtml(h.description)}"`)
  meta(`name="twitter:image" content="${escapeHtml(h.ogImage)}"`)
  for (const schema of h.jsonLd ?? []) {
    // "<" is escaped inside JSON so a "</script>" in content cannot break out of the block.
    t.push(`<script type="application/ld+json" data-prerender>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`)
  }
  return t.join('\n    ')
}

export function compose(shell: string, head: string, body: string): string {
  return shell
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}
