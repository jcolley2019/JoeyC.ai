import { useState } from 'react'

interface BlogConnectionModalProps {
  open: boolean
  onClose: () => void
  onConnect: (params: {
    platform: 'wordpress' | 'ghost'
    site_url: string
    credentials: Record<string, string>
  }) => Promise<boolean>
  connecting: boolean
  error: string | null
}

export function BlogConnectionModal({ open, onClose, onConnect, connecting, error }: BlogConnectionModalProps) {
  const [platform, setPlatform] = useState<'wordpress' | 'ghost' | null>(null)
  const [siteUrl, setSiteUrl] = useState('')
  // WordPress fields
  const [wpUsername, setWpUsername] = useState('')
  const [wpAppPassword, setWpAppPassword] = useState('')
  // Ghost fields
  const [ghostApiKey, setGhostApiKey] = useState('')

  if (!open) return null

  const canSubmit = siteUrl.trim().length > 0 && (
    (platform === 'wordpress' && wpUsername.trim().length > 0 && wpAppPassword.trim().length > 0) ||
    (platform === 'ghost' && ghostApiKey.trim().length > 0)
  )

  const handleSubmit = async () => {
    if (!platform || !canSubmit) return

    const credentials: Record<string, string> = platform === 'wordpress'
      ? { username: wpUsername.trim(), app_password: wpAppPassword.trim() }
      : { admin_api_key: ghostApiKey.trim() }

    const success = await onConnect({
      platform,
      site_url: siteUrl.trim(),
      credentials,
    })

    if (success) {
      onClose()
      // Reset form
      setPlatform(null)
      setSiteUrl('')
      setWpUsername('')
      setWpAppPassword('')
      setGhostApiKey('')
    }
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Connect Your Blog</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Platform selection */}
        {!platform ? (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary font-mono">Select your blogging platform:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPlatform('wordpress')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-bg hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <span className="text-2xl">W</span>
                <span className="text-xs font-mono text-white font-medium">WordPress</span>
                <span className="text-[10px] text-text-secondary">Self-hosted or .com</span>
              </button>
              <button
                onClick={() => setPlatform('ghost')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-bg hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <span className="text-2xl">G</span>
                <span className="text-xs font-mono text-white font-medium">Ghost</span>
                <span className="text-[10px] text-text-secondary">Ghost Admin API</span>
              </button>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-text-secondary font-mono leading-relaxed">
                <span className="text-[#4a9eff]">Substack, Wix, Squarespace, Webflow?</span><br />
                Direct publishing not available for these platforms yet. Use Download or Copy instead.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setPlatform(null)}
              className="text-xs font-mono text-text-secondary hover:text-white transition-colors"
            >
              ← Back to platform selection
            </button>

            <div>
              <label className="block font-mono text-xs text-text-secondary mb-1">
                {platform === 'wordpress' ? 'WordPress' : 'Ghost'} Site URL
              </label>
              <input
                type="url"
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
                placeholder={platform === 'wordpress' ? 'https://yourblog.com' : 'https://yourblog.ghost.io'}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {platform === 'wordpress' && (
              <>
                <div>
                  <label className="block font-mono text-xs text-text-secondary mb-1">WordPress Username</label>
                  <input
                    type="text"
                    value={wpUsername}
                    onChange={e => setWpUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-text-secondary mb-1">Application Password</label>
                  <input
                    type="password"
                    value={wpAppPassword}
                    onChange={e => setWpAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-[10px] text-text-secondary mt-1 font-mono">
                    WordPress Dashboard → Users → Profile → Application Passwords
                  </p>
                </div>
              </>
            )}

            {platform === 'ghost' && (
              <div>
                <label className="block font-mono text-xs text-text-secondary mb-1">Admin API Key</label>
                <input
                  type="password"
                  value={ghostApiKey}
                  onChange={e => setGhostApiKey(e.target.value)}
                  placeholder="abc123:def456..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[10px] text-text-secondary mt-1 font-mono">
                  Ghost Admin → Settings → Integrations → Add custom integration → Admin API Key
                </p>
              </div>
            )}

            {error && <p className="text-xs font-mono text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-border rounded-lg text-text-secondary text-xs font-mono hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || connecting}
                className="flex-1 py-2 bg-primary text-bg rounded-lg text-xs font-mono font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {connecting ? 'Testing connection...' : 'Connect'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
