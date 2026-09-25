import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserRole } from '../../types'

// Context + hook live apart from <AuthProvider> so that module exports only a component (fast refresh)
export type Role = UserRole['role'] | null

export interface AuthContextValue {
  session: Session | null
  /** True until the initial session has been read (and, when signed in, the role has been fetched). */
  loading: boolean
  role: Role
  isMasterAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
