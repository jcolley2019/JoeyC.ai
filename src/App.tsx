import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Portfolio } from './components/sections/Portfolio'
import { Blog } from './components/sections/Blog'
import { BlogPreview } from './components/sections/BlogPreview'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { MouseGlow } from './components/ui/MouseGlow'

export default function App() {
  return (
    <div className="min-h-screen bg-bg noise-overlay" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
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
