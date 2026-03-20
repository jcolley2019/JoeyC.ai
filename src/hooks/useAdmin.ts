import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types'

export function useAdmin() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setRole(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!cancelled) {
        if (error || !data) {
          setRole(null)
        } else {
          setRole(data as UserRole)
        }
        setLoading(false)
      }
    }

    checkRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true)
      checkRole()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return {
    isMasterAdmin: role?.role === 'master_admin',
    role: role?.role || null,
    loading,
  }
}
