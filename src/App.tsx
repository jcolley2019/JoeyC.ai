import { Navbar } from './components/layout/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { SocialLinks } from './components/sections/SocialLinks'
import { Portfolio } from './components/sections/Portfolio'
import { Blog } from './components/sections/Blog'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { MouseGlow } from './components/ui/MouseGlow'

export default function App() {
  return (
    <div className="min-h-screen bg-bg noise-overlay">
      <MouseGlow />
      <Navbar />
      <Hero />
      <About />
      <Portfolio />
      <Blog />
      <SocialLinks />
      <Contact />
      <Footer />
    </div>
  )
}
