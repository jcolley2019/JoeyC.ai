import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Read before createClient() runs — the client strips auth params off the URL as
 * soon as it initializes, so anything that needs to know how the user arrived
 * (e.g. the password reset page) has to read them from here.
 */
export const initialAuthParams = (() => {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const pick = (key: string) => hash.get(key) ?? query.get(key)
  return {
    type: pick('type'),
    code: query.get('code'),
    hasAccessToken: hash.has('access_token'),
    error: pick('error'),
    errorCode: pick('error_code'),
    errorDescription: pick('error_description'),
  }
})()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
