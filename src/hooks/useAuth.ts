import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // Account creation is invite-only (L3-03): accounts are created server-side by
  // the send-invite edge function (auth.admin.generateLink type "invite") and the
  // invitee arrives already signed in via the emailed link. There is deliberately
  // no sign-up or OAuth sign-in call here — both would create users from the browser.

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return { session, loading, login, logout }
}
