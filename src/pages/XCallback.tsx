import { useEffect, useState } from 'react'
import { useXAccount } from '../hooks/useXAccount'

/**
 * OAuth 2.0 callback page for X account connection.
 * X redirects here after the user authorizes the app.
 * This page exchanges the code for tokens, then closes the popup.
 */
export function XCallback() {
  const { completeAuth } = useXAccount()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Connecting your X account...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')
        const error = params.get('error')

        if (error) {
          throw new Error(`X authorization denied: ${error}`)
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state from X')
        }

        const result = await completeAuth(code, state)
        setStatus('success')
        setMessage(`Connected as @${result.x_username}`)

        // Close popup after a short delay
        setTimeout(() => {
          window.close()
        }, 1500)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Failed to connect X account')

        // Close popup after showing error
        setTimeout(() => {
          window.close()
        }, 3000)
      }
    }

    handleCallback()
  }, [completeAuth])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        {status === 'processing' && (
          <>
            <div className="animate-spin h-8 w-8 border-2 border-[#1d9bf0] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-text-secondary text-sm font-mono">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-8 w-8 mx-auto mb-4 text-green-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-green-400 text-sm font-mono">{message}</p>
            <p className="text-text-secondary text-xs font-mono mt-2">This window will close automatically...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-8 w-8 mx-auto mb-4 text-red-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-red-400 text-sm font-mono">{message}</p>
            <p className="text-text-secondary text-xs font-mono mt-2">This window will close automatically...</p>
          </>
        )}
      </div>
    </div>
  )
}
