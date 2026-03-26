import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface BlogConnection {
  platform: 'wordpress' | 'ghost'
  site_url: string
  connected_at: string
}

interface ConnectParams {
  platform: 'wordpress' | 'ghost'
  site_url: string
  credentials: Record<string, string>
}

interface PublishResult {
  success: boolean
  url?: string
  platform?: string
  error?: string
}

export function useBlogConnection() {
  const [connections, setConnections] = useState<BlogConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('blog-connection', {
        body: { action: 'status' },
      })
      if (fnError) throw fnError
      setConnections(data.connections || [])
    } catch {
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  const connect = useCallback(async (params: ConnectParams): Promise<boolean> => {
    setConnecting(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('blog-connection', {
        body: { action: 'connect', ...params },
      })
      if (fnError) {
        const msg = data?.error || fnError.message
        throw new Error(msg)
      }
      if (data?.error) throw new Error(data.error)
      await checkStatus()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      return false
    } finally {
      setConnecting(false)
    }
  }, [checkStatus])

  const disconnect = useCallback(async (platform: string) => {
    setError(null)
    try {
      await supabase.functions.invoke('blog-connection', {
        body: { action: 'disconnect', platform },
      })
      setConnections(prev => prev.filter(c => c.platform !== platform))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }, [])

  const publish = useCallback(async (platform: string, title: string, content: string): Promise<PublishResult> => {
    setPublishing(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('blog-connection', {
        body: { action: 'publish', platform, title, content },
      })
      if (fnError) {
        const msg = data?.error || fnError.message
        throw new Error(msg)
      }
      if (data?.error) throw new Error(data.error)
      return { success: true, url: data.url, platform: data.platform }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setPublishing(false)
    }
  }, [])

  return {
    connections,
    loading,
    connecting,
    publishing,
    error,
    connect,
    disconnect,
    publish,
    refresh: checkStatus,
    clearError: () => setError(null),
  }
}
