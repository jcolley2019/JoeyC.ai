import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSiteSetting(key: string, defaultValue = true) {
  const [value, setValue] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single()
      .then(({ data }) => {
        setValue(data?.value ?? defaultValue)
        setLoading(false)
      })
  }, [key])

  const update = useCallback(async (newValue: boolean) => {
    setValue(newValue)
    await supabase
      .from('site_settings')
      .upsert({ key, value: newValue, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }, [key])

  return { value, loading, update }
}
