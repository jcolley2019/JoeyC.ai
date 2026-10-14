/**
 * Copy for the /contact money page and the blog's "Work with me" CTA. The SPA (ContactPage.tsx,
 * BlogPost.tsx) and the prerender (api/contact.ts, api/blog.ts) both read it, so each page says
 * the same thing before and after hydration.
 */

export const CONTACT_PAGE = {
  title: 'Work with me — AI apps, websites & automations | Joey Colley',
  description: 'Hire Joey Colley to build your AI app, website or automation. Tell me about your project in 60 seconds — I reply within 24 hours.',
  heading: 'Work with me: AI apps, websites and automations for small businesses',
  intro: "I build and ship AI apps, websites and automations myself with Claude Code. Two of my live builds are luxvibe.io, an AI-powered hotel booking platform, and titilinks.com, a bio-link app for TikTok creators. Tell me about your project below: I'll reply within 24 hours, we'll have a short call, and you'll get a fixed quote.",
}

/** The page's one JSON-LD object; `sameAs` is the social profiles the site already publishes. */
export function contactPageJsonLd(siteUrl: string, sameAs: string[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: `${siteUrl}/contact`,
    mainEntity: { '@type': 'Person', name: 'Joey Colley', url: siteUrl, sameAs },
  }
}

export const BLOG_CTA = {
  heading: 'Working on something like this?',
  text: "If you want an AI app, website or automation built for your business, tell me about it and I'll reply within 24 hours.",
  link: 'Work with me',
}
