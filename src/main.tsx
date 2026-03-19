import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App'
import { LanguageProvider } from './hooks/useLanguage'
import { BlogList } from './pages/BlogList'
import { BlogPostPage } from './pages/BlogPost'

const CommandCenter = lazy(() =>
  import('./components/command-center/CommandCenter').then(m => ({
    default: m.CommandCenter,
  }))
)

const Loading = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route
          path="/command-center"
          element={
            <Suspense fallback={<Loading />}>
              <LanguageProvider>
                <CommandCenter />
              </LanguageProvider>
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
