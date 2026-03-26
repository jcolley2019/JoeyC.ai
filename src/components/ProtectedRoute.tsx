import { useState, useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

/**
 * Protects routes that require authentication and/or admin role.
 * - Not logged in → redirect to /command-center (which shows AuthGate login form)
 * - Logged in but not admin on admin route → redirect to /command-center
 * - Logged in (and admin if required) → render children
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'admin' | 'unauthenticated'>('loading')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session) {
        setState('unauthenticated')
        return
      }

      if (!requireAdmin) {
        setState('authenticated')
        return
      }

      // Check admin role
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (cancelled) return

      if (data?.role === 'master_admin') {
        setState('admin')
      } else {
        setState('authenticated')
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setState('loading')
      check()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [requireAdmin])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Not logged in → send to /command-center where AuthGate shows the login form
  if (state === 'unauthenticated') {
    return <Navigate to="/command-center" replace />
  }

  // Authenticated but not admin, trying to access admin route
  if (requireAdmin && state !== 'admin') {
    return <Navigate to="/command-center" replace />
  }

  return <>{children}</>
}
