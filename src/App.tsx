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

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Joey Colley',
  url: 'https://www.joeyc.ai',
  jobTitle: 'AI Builder & Content Creator',
  description: 'Self-taught AI builder documenting the journey of building real apps with AI tools like Claude, Lovable, and Replit.',
  sameAs: [
    'https://www.tiktok.com/@buildaiwithjoey',
    'https://www.instagram.com/gobuildai',
    'https://www.youtube.com/@buildaiwithjoey',
    'https://www.pinterest.com/buildaiwithjoey',
  ],
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg noise-overlay" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      <Seo
        title="JoeyC.ai — Practical AI for Everyone"
        description="Joey Colley — I build apps, websites & automations with AI and show you how. No CS degree required."
        canonical={SITE_URL}
        ogType="website"
        jsonLd={[personSchema]}
      />
      <MouseGlow />
      <Navbar />
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
      <Footer />
    </div>
  )
}
