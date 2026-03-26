import { Helmet } from 'react-helmet-async'
import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Portfolio } from './components/sections/Portfolio'
import { Blog } from './components/sections/Blog'
import { BlogPreview } from './components/sections/BlogPreview'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { MouseGlow } from './components/ui/MouseGlow'

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Joey Colley',
  url: 'https://joeyc.ai',
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
      <Helmet>
        <title>JoeyC.ai — Practical AI for Everyone</title>
        <meta name="description" content="Joey Colley — I build apps, websites & automations with AI and show you how. No CS degree required." />
        <link rel="canonical" href="https://joeyc.ai" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="JoeyC.ai — Practical AI for Everyone" />
        <meta property="og:description" content="Joey Colley — I build apps, websites & automations with AI and show you how. No CS degree required." />
        <meta property="og:url" content="https://joeyc.ai" />
        <meta property="og:image" content="https://joeyc.ai/photos/joey-headshot2.png" />
        <meta property="og:site_name" content="JoeyC.ai" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JoeyC.ai — Practical AI for Everyone" />
        <meta name="twitter:description" content="Joey Colley — I build apps, websites & automations with AI and show you how." />
        <meta name="twitter:image" content="https://joeyc.ai/photos/joey-headshot2.png" />

        {/* JSON-LD Person Schema */}
        <script type="application/ld+json">{JSON.stringify(personSchema)}</script>
      </Helmet>
      <MouseGlow />
      <Navbar />
      <Hero />
      <div className="section-divider" />
      <About />
      <div className="section-divider" />
      <Portfolio />
      <div className="section-divider" />
      <Blog />
      <div className="section-divider" />
      <BlogPreview />
      <div className="section-divider" />
      <Contact />
      <div className="section-divider" />
      <Footer />
    </div>
  )
}
