import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MASTER_EMAILS } from '../lib/constants'
import type { BrandProfile } from '../types'

const CACHE_PREFIX = 'brand-profile-'

export function useBrandProfile() {
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Fetch profile on mount
  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) {
        setLoading(false)
        return
      }

      const uid = session.user.id
      const email = session.user.email ?? null
      setUserId(uid)
      setUserEmail(email)

      // Try localStorage cache first for instant render
      try {
        const cached = localStorage.getItem(CACHE_PREFIX + uid)
        if (cached) {
          const parsed = JSON.parse(cached) as BrandProfile
          setProfile(parsed)
        }
      } catch {}

      // Then fetch from Supabase to validate
      supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return
          if (error) {
            console.warn('brand_profiles fetch failed:', error.message)
          } else if (data) {
            setProfile(data as BrandProfile)
            try { localStorage.setItem(CACHE_PREFIX + uid, JSON.stringify(data)) } catch {}
          } else {
            setProfile(null)
            try { localStorage.removeItem(CACHE_PREFIX + uid) } catch {}
          }
          setLoading(false)
        })
    })

    return () => { cancelled = true }
  }, [])

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null)
        setUserId(null)
        setUserEmail(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

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
      setProfile(data as BrandProfile)
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

  // Master admins always count as onboarded
  const isOnboarded = (userEmail !== null && MASTER_EMAILS.includes(userEmail)) || profile?.onboarding_completed === true

  return { profile, loading, saveProfile, uploadLogo, isOnboarded }
}
