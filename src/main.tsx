import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { LanguageProvider } from './hooks/useLanguage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ScrollToTop } from './components/ScrollToTop'
import { NotFound } from './pages/NotFound'
import { Seo } from './components/Seo'

const BlogList = lazy(() => import('./pages/BlogList').then(m => ({ default: m.BlogList })))
const BlogPostPage = lazy(() => import('./pages/BlogPost').then(m => ({ default: m.BlogPostPage })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then(m => ({ default: m.AuthCallback })))
const XCallback = lazy(() => import('./pages/XCallback').then(m => ({ default: m.XCallback })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const Sandbox = lazy(() => import('./pages/Sandbox').then(m => ({ default: m.Sandbox })))
const CommandCenter = lazy(() =>
  import('./components/command-center/CommandCenter').then(m => ({ default: m.CommandCenter }))
)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })))

/** Private and utility routes: never indexed; each still gets a real title. */
const NoIndex = ({ title }: { title: string }) => (
  <Seo title={`${title} — JoeyC.ai`} description="JoeyC.ai" noindex />
)

const Loading = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
)

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// The blog prerender (api/blog.ts) injects head tags marked data-prerender; drop them before
// React renders its own so every route ends up with exactly one of each.
document.querySelectorAll('[data-prerender]').forEach(el => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth/callback" element={<><NoIndex title="Signing in" /><AuthCallback /></>} />
            <Route path="/x-callback" element={<><NoIndex title="Connecting X" /><XCallback /></>} />
            <Route path="/reset-password" element={<><NoIndex title="Reset password" /><ResetPassword /></>} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/sandbox" element={<><NoIndex title="Sandbox" /><Sandbox /></>} />
            <Route
              path="/command-center"
              element={
                <>
                  <NoIndex title="Content Studio" />
                  <LanguageProvider>
                    <CommandCenter />
                  </LanguageProvider>
                </>
              }
            />
            <Route
              path="/admin"
              element={
                <>
                  <NoIndex title="Admin" />
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                </>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
