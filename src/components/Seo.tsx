/**
 * Single source of page metadata. Relies on React 19 hoisting <title>, <meta> and <link>
 * into <head>; the JSON-LD <script> stays where it renders, which is valid for crawlers.
 * index.html carries none of these tags, and main.tsx strips any server-injected
 * [data-prerender] tags before mounting, so each route yields exactly one of each.
 */

export const SITE_URL = 'https://www.joeyc.ai'
export const SITE_NAME = 'JoeyC.ai'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/photos/og-image.png`

export interface SeoArticle {
  publishedTime?: string | null
  modifiedTime?: string | null
  tags?: string[]
  author?: string
}

export interface SeoProps {
  title: string
  description: string
  /** Absolute URL. Omit for pages that should not be indexed. */
  canonical?: string
  ogType?: 'website' | 'article'
  /** Absolute URL; defaults to the site card. */
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  twitterSite?: string
  noindex?: boolean
  article?: SeoArticle
  jsonLd?: Array<Record<string, unknown>>
}

export function Seo({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  twitterCard = 'summary_large_image',
  twitterSite,
  noindex = false,
  article,
  jsonLd = [],
}: SeoProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
      {(article?.tags ?? []).map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      <meta name="twitter:card" content={twitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </>
  )
}
