import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export function NotFound() {
  return (
    <div className="min-h-screen bg-bg noise-overlay flex flex-col">
      <Helmet>
        <title>Not found — JoeyC.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
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
