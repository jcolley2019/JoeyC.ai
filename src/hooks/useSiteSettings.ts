import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSiteSetting(key: string, defaultValue = true) {
  const [value, setValue] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.warn(`site_settings: "${key}" fetch failed`, error.message)
        }
        setValue(data?.value ?? defaultValue)
        setLoading(false)
      }, (err: unknown) => {
        if (cancelled) return
        console.warn(`site_settings: "${key}" fetch failed`, err instanceof Error ? err.message : err)
        setValue(defaultValue)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [key])

  const update = useCallback(async (newValue: boolean) => {
    setValue(newValue)
    await supabase
      .from('site_settings')
      .upsert({ key, value: newValue, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }, [key])

  return { value, loading, update }
}
