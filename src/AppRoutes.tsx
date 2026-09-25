import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './hooks/LanguageProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { NotFound } from './pages/NotFound'
import { NoIndex, PageLoading as Loading } from './components/RouteParts'

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

/** The route table; lives outside main.tsx so the entry module defines no components (fast refresh). */
export function AppRoutes() {
  return (
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
  )
}
