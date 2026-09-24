import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

/**
 * Protects routes that require authentication and/or admin role. Reads the shared
 * AuthProvider context (A1) — no subscription or role query of its own.
 * - Not logged in → redirect to /command-center (AuthGate login form), carrying `state.from`
 *   so the Studio can send the user back here after login
 * - Logged in but not admin on admin route → redirect to /command-center
 * - Logged in (and admin if required) → render children
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, loading, isMasterAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/command-center" replace state={{ from: location }} />
  }

  if (requireAdmin && !isMasterAdmin) {
    return <Navigate to="/command-center" replace />
  }

  return <>{children}</>
}
