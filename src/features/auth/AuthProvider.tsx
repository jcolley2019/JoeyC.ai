import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { UserRole } from '../../types'

type Role = UserRole['role'] | null

interface AuthContextValue {
  session: Session | null
  /** True until the initial session has been read (and, when signed in, the role has been fetched). */
  loading: boolean
  role: Role
  isMasterAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * The single auth subscription for the whole app (A1 / L4-12).
 *
 * - One `onAuthStateChange` listener; consumers read the session from context.
 * - The role is read from `user_roles` once per user id — a token refresh yields a new
 *   session object but the same user id, so it does not trigger another read.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  // Role keyed on the user id it was fetched for, so a stale role never leaks across users.
  const [roleState, setRoleState] = useState<{ userId: string; role: Role } | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setSession(session)
      setSessionReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      // Ignore the initial replay: getSession above already delivered it (and may be racing us).
      if (_event === 'INITIAL_SESSION') return
      setSession(next)
      setSessionReady(true)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  useEffect(() => {
    // Signed out: nothing to fetch. A stale roleState is harmless — `role` below only
    // honours it while its userId matches the current session.
    if (!userId) return
    let cancelled = false
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.warn('user_roles fetch failed:', error.message)
        setRoleState({ userId, role: (data?.role as Role) ?? null })
      })
    return () => { cancelled = true }
  }, [userId])

  const roleLoaded = !userId || roleState?.userId === userId
  const role: Role = userId && roleState?.userId === userId ? roleState.role : null

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading: !sessionReady || !roleLoaded,
    role,
    isMasterAdmin: role === 'master_admin',
    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    // Account creation is invite-only (L3-03): accounts are created server-side by
    // the send-invite edge function. There is deliberately no sign-up call here.
    logout: async () => {
      await supabase.auth.signOut()
    },
  }), [session, sessionReady, roleLoaded, role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
