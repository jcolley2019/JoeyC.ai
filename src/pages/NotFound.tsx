import { Seo } from '../components/Seo'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export function NotFound() {
  return (
    <div className="min-h-screen bg-bg noise-overlay flex flex-col">
      <Seo title="Not found — JoeyC.ai" description="This page does not exist." noindex />
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-32 text-center">
        <p className="font-mono text-sm text-text-secondary mb-4">404</p>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">This page does not exist</h1>
        <Link to="/" className="text-primary hover:text-primary-hover hover:underline transition-colors">
          Back to the home page
        </Link>
      </main>
      <Footer />
    </div>
  )
}
