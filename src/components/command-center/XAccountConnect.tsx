import { useState } from 'react'
import { useXAccount } from '../../hooks/useXAccount'

/**
 * X Account connection widget.
 * Shows "Connect X Account" or connected status with disconnect option.
 */
export function XAccountConnect() {
  const { status, loading, connecting, error, connect, disconnect } = useXAccount()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg-card">
        <div className="animate-spin h-3.5 w-3.5 border-2 border-text-secondary border-t-transparent rounded-full" />
        <span className="text-xs font-mono text-text-secondary">Checking X connection...</span>
      </div>
    )
  }

  if (status?.connected) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#1d9bf0]/20 bg-[#1d9bf0]/5">
        <div className="flex items-center gap-2">
          {/* X logo */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#1d9bf0]">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-xs font-mono text-[#1d9bf0]">
            @{status.x_username}
          </span>
          {status.x_display_name && (
            <span className="text-xs font-mono text-text-secondary">
              ({status.x_display_name})
            </span>
          )}
        </div>

        {!confirmDisconnect ? (
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="text-xs font-mono text-text-secondary hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-secondary font-mono">Sure?</span>
            <button
              onClick={() => { disconnect(); setConfirmDisconnect(false) }}
              className="px-2 py-0.5 text-xs font-mono bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDisconnect(false)}
              className="px-2 py-0.5 text-xs font-mono border border-border rounded hover:border-text-secondary transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1d9bf0]/30 bg-[#1d9bf0]/10 text-[#1d9bf0] hover:bg-[#1d9bf0]/20 transition-colors text-xs font-mono disabled:opacity-50"
      >
        {connecting ? (
          <>
            <div className="animate-spin h-3.5 w-3.5 border-2 border-[#1d9bf0] border-t-transparent rounded-full" />
            Connecting...
          </>
        ) : (
          <>
            {/* X logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Connect X Account
          </>
        )}
      </button>
      {error && (
        <p className="text-xs font-mono text-red-400">{error}</p>
      )}
    </div>
  )
}
