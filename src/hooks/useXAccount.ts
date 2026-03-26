import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface XAccountStatus {
  connected: boolean
  x_username: string | null
  x_display_name: string | null
  token_expires_at: string | null
  connected_at: string | null
}

export function useXAccount() {
  const [status, setStatus] = useState<XAccountStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check connection status
  const checkStatus = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('x-oauth', {
        body: { action: 'status' },
      })
      if (fnError) throw fnError
      setStatus(data as XAccountStatus)
    } catch {
      // Not connected or error — treat as disconnected
      setStatus({ connected: false, x_username: null, x_display_name: null, token_expires_at: null, connected_at: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Start OAuth flow — opens X authorization in a popup
  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)

    try {
      const redirectUri = `${window.location.origin}/x-callback`

      const { data, error: fnError } = await supabase.functions.invoke('x-oauth', {
        body: { action: 'authorize', redirect_uri: redirectUri },
      })

      if (fnError) throw fnError

      const { auth_url, state, code_verifier } = data

      // Store PKCE values in sessionStorage for the callback
      sessionStorage.setItem('x_oauth_state', state)
      sessionStorage.setItem('x_oauth_code_verifier', code_verifier)
      sessionStorage.setItem('x_oauth_redirect_uri', redirectUri)

      // Open X auth in a popup
      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      const popup = window.open(
        auth_url,
        'x-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )

      // Poll for popup close / callback completion
      const pollInterval = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(pollInterval)
          setConnecting(false)
          // Check if connection succeeded
          await checkStatus()
        }
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start X connection')
      setConnecting(false)
    }
  }, [checkStatus])

  // Complete the OAuth flow (called from the callback page)
  const completeAuth = useCallback(async (code: string, state: string) => {
    const savedState = sessionStorage.getItem('x_oauth_state')
    const codeVerifier = sessionStorage.getItem('x_oauth_code_verifier')
    const redirectUri = sessionStorage.getItem('x_oauth_redirect_uri')

    // Validate state matches
    if (state !== savedState) {
      throw new Error('OAuth state mismatch — possible CSRF attack')
    }

    if (!codeVerifier || !redirectUri) {
      throw new Error('Missing PKCE data — please try connecting again')
    }

    const { data, error: fnError } = await supabase.functions.invoke('x-oauth', {
      body: {
        action: 'callback',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
    })

    if (fnError) throw fnError

    // Clean up sessionStorage
    sessionStorage.removeItem('x_oauth_state')
    sessionStorage.removeItem('x_oauth_code_verifier')
    sessionStorage.removeItem('x_oauth_redirect_uri')

    return data
  }, [])

  // Disconnect X account
  const disconnect = useCallback(async () => {
    setError(null)
    try {
      const { error: fnError } = await supabase.functions.invoke('x-oauth', {
        body: { action: 'disconnect' },
      })
      if (fnError) throw fnError
      setStatus({ connected: false, x_username: null, x_display_name: null, token_expires_at: null, connected_at: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }, [])

  return {
    status,
    loading,
    connecting,
    error,
    connect,
    completeAuth,
    disconnect,
    refresh: checkStatus,
  }
}
