/**
 * Prerendered /contact (rewritten here by vercel.json): the money page's head tags and a
 * plain-HTML summary of it. No form here; the SPA replaces #root on mount and renders the
 * real one (src/pages/ContactPage.tsx).
 */
import { SITE_URL, escapeHtml, type VercelRequest, type VercelResponse } from './_shared.js'
import { CACHE_OK, readShell, headTags, compose } from './_prerender.js'
import { CONTACT_PAGE, contactPageJsonLd } from '../src/lib/contactPage.js'

// The live profiles the home page publishes as sameAs. src/data/socials.ts is the source; it
// pulls in react-icons, so the URLs are mirrored here instead of imported.
const SAME_AS = [
  'https://www.tiktok.com/@buildaiwithjoey',
  'https://www.instagram.com/gobuildai',
  'https://www.pinterest.com/buildaiwithjoey',
  'https://x.com/buildaiwithjoey',
]

// The form's service options (src/components/sections/Contact.tsx), without "Other".
const SERVICES = ['AI App / Custom Tool', 'Website Build or Redesign', 'Automation & Workflows', 'AI Consulting / Strategy']

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const head = headTags({
    title: CONTACT_PAGE.title,
    description: CONTACT_PAGE.description,
    canonical: `${SITE_URL}/contact`,
    ogType: 'website',
    ogImage: `${SITE_URL}/photos/og-image.png`,
    twitterCard: 'summary_large_image',
    jsonLd: [contactPageJsonLd(SITE_URL, SAME_AS)],
  })

  // The intro block matches ContactPage.tsx so the swap to the SPA keeps it in place.
  const services = SERVICES.map(s => `<li class="flex items-center gap-3"><span aria-hidden="true" class="font-mono text-primary text-sm">&gt;</span><span class="text-text-secondary text-sm">${escapeHtml(s)}</span></li>`).join('')
  const body = `<div class="min-h-screen bg-bg noise-overlay overflow-x-hidden"><main><div class="border-b border-border/50 bg-gradient-to-b from-primary/[0.03] to-transparent"><div class="max-w-5xl mx-auto px-6 pt-20 pb-14"><a href="/" class="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-8"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 8H3m4 4l-4-4 4-4" /></svg>Back to site</a><h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl">${escapeHtml(CONTACT_PAGE.heading)}</h1><p class="text-text-secondary text-lg max-w-3xl leading-relaxed">${escapeHtml(CONTACT_PAGE.intro)}</p></div></div><section class="py-28 px-6"><div class="max-w-5xl mx-auto"><ul aria-label="Services" class="space-y-4">${services}</ul><p class="mt-8 text-text-secondary text-xs">I'll reply within 24 hours.</p></div></section></main></div>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', CACHE_OK)
  res.setHeader('X-Prerender', 'contact')
  res.status(200).send(compose(readShell(), head, body))
}
