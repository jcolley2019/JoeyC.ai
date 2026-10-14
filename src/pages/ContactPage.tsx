import { Link } from 'react-router-dom'
import { Seo, SITE_URL } from '../components/Seo'
import { Contact } from '../components/sections/Contact'
import { socials } from '../data/socials'
import { CONTACT_PAGE, contactPageJsonLd } from '../lib/contactPage'

// The same live profiles the home page publishes as sameAs (no placeholders, no self-link)
const sameAs = socials
  .filter(s => !s.comingSoon && s.url.startsWith('http') && !s.url.startsWith(SITE_URL))
  .map(s => s.url)

/** /contact: the intro api/contact.ts also prerenders, then the home page's contact form. */
export function ContactPage() {
  return (
    <div className="min-h-screen bg-bg noise-overlay overflow-x-hidden">
      <Seo
        title={CONTACT_PAGE.title}
        description={CONTACT_PAGE.description}
        canonical={`${SITE_URL}/contact`}
        ogType="website"
        jsonLd={[contactPageJsonLd(SITE_URL, sameAs)]}
      />
      <main>
        <div className="border-b border-border/50 bg-gradient-to-b from-primary/[0.03] to-transparent">
          <div className="max-w-5xl mx-auto px-6 pt-20 pb-14">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-8"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 8H3m4 4l-4-4 4-4" />
              </svg>
              Back to site
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl">
              {CONTACT_PAGE.heading}
            </h1>
            <p className="text-text-secondary text-lg max-w-3xl leading-relaxed">
              {CONTACT_PAGE.intro}
            </p>
          </div>
        </div>
        <Contact />
      </main>
    </div>
  )
}
