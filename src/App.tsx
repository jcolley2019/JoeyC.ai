import { Seo, SITE_URL } from './components/Seo'
import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Portfolio } from './components/sections/Portfolio'
import { Content } from './components/sections/Content'
import { BlogPreview } from './components/sections/BlogPreview'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { MouseGlow } from './components/ui/MouseGlow'
import { socials } from './data/socials'

// Live external profiles only (no placeholders, no self-link)
const sameAs = socials
  .filter(s => !s.comingSoon && s.url.startsWith('http') && !s.url.startsWith(SITE_URL))
  .map(s => s.url)
const xHandle = socials.find(s => s.platform === 'X' && !s.comingSoon)?.url.split('/').pop()
const twitterSite = xHandle ? `@${xHandle}` : undefined

const personSchema = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'Joey Colley',
  url: SITE_URL,
  image: `${SITE_URL}/photos/joey-og.jpg`,
  jobTitle: 'AI Builder & Content Creator',
  description: 'Self-taught AI builder documenting the journey of building real apps with AI tools like Claude, Lovable, and Replit.',
  sameAs,
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'JoeyC.ai',
  url: SITE_URL,
  description: 'Practical AI for everyone: apps, websites and automations built in public.',
  publisher: { '@id': `${SITE_URL}/#person` },
  inLanguage: 'en',
}

const profilePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${SITE_URL}/#profile`,
  url: SITE_URL,
  name: 'Joey Colley — JoeyC.ai',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  mainEntity: personSchema,
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg noise-overlay" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      <Seo
        title="JoeyC.ai — Practical AI for Everyone"
        description="Joey Colley — I build apps, websites & automations with AI and show you how. No CS degree required."
        canonical={SITE_URL}
        ogType="website"
        twitterSite={twitterSite}
        jsonLd={[websiteSchema, profilePageSchema]}
      />
      <MouseGlow />
      <Navbar />
      <main>
        <Hero />
        <div className="section-divider" />
        <About />
        <div className="section-divider" />
        <Portfolio />
        <div className="section-divider" />
        <Content />
        <div className="section-divider" />
        <BlogPreview />
        <div className="section-divider" />
        <Contact />
        <div className="section-divider" />
      </main>
      <Footer />
    </div>
  )
}
