import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { BrandProfile } from '../types'

const CACHE_PREFIX = 'brand-profile-'

export function useBrandProfile() {
  // Session + role come from the shared AuthProvider (A1): no getSession/onAuthStateChange here.
  const { session, isMasterAdmin, loading: roleLoading } = useAuth()
  const userId = session?.user.id ?? null

  // Last server answer, keyed by the user it belongs to — never leaks across logins.
  const [fetched, setFetched] = useState<{ uid: string; profile: BrandProfile | null } | null>(null)

  // localStorage cache gives an instant first paint while the fetch is in flight.
  const cached = useMemo<BrandProfile | null>(() => {
    if (!userId) return null
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + userId)
      return raw ? (JSON.parse(raw) as BrandProfile) : null
    } catch {
      return null
    }
  }, [userId])

  const profile = userId ? (fetched?.uid === userId ? fetched.profile : cached) : null
  const loading = roleLoading || (!!userId && fetched?.uid !== userId)

  // Fetch whenever the signed-in user changes (login/logout — not on token refresh)
  useEffect(() => {
    if (roleLoading || !userId) return
    let cancelled = false
    const uid = userId

    supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn('brand_profiles fetch failed:', error.message)
          setFetched({ uid, profile: cached })
        } else if (data) {
          setFetched({ uid, profile: data as BrandProfile })
          try { localStorage.setItem(CACHE_PREFIX + uid, JSON.stringify(data)) } catch {}
        } else {
          setFetched({ uid, profile: null })
          try { localStorage.removeItem(CACHE_PREFIX + uid) } catch {}
        }
      })

    return () => { cancelled = true }
  }, [userId, roleLoading, cached])

  const saveProfile = useCallback(async (updates: Partial<BrandProfile>) => {
    if (!userId) return

    const now = new Date().toISOString()
    const row = {
      ...updates,
      user_id: userId,
      updated_at: now,
    }

    // Upsert without chaining .select() to avoid 406 on new rows
    const { error: upsertError } = await supabase
      .from('brand_profiles')
      .upsert(row, { onConflict: 'user_id' })

    if (upsertError) {
      console.warn('brand_profiles upsert failed:', upsertError.message)
      return
    }

    // Fetch the saved row separately — always works
    const { data, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.warn('brand_profiles fetch after save failed:', fetchError.message)
      return
    }

    if (data) {
      setFetched({ uid: userId, profile: data as BrandProfile })
      try { localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data)) } catch {}
    }
  }, [userId])

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null

    const ext = file.name.split('.').pop() || 'png'
    const path = `${userId}/logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('Logo upload failed:', uploadError)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(path)

    const publicUrl = urlData.publicUrl
    await saveProfile({ logo_url: publicUrl })
    return publicUrl
  }, [userId, saveProfile])

  // Master admins always count as onboarded (by role, not by a bundled email list)
  const isOnboarded = isMasterAdmin || profile?.onboarding_completed === true

  return { profile, loading, saveProfile, uploadLogo, isOnboarded }
}
