import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { SocialLinks } from './components/sections/SocialLinks'
import { Portfolio } from './components/sections/Portfolio'
import { Blog } from './components/sections/Blog'
import { Footer } from './components/layout/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Hero />
      <About />
      <SocialLinks />
      <Portfolio />
      <Blog />
      {/* <WorkWithMe /> — uncomment when ready to launch AI agency */}
      <Footer />
    </div>
  )
}
