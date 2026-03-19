import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

interface AuthGateProps {
  onLogin: (email: string, password: string) => Promise<void>
  children: React.ReactNode
  isAuthenticated: boolean
}

export function AuthGate({ onLogin, children, isAuthenticated }: AuthGateProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <>{children}</>

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-3">
            {'// command center'}
          </p>
          <h1 className="text-2xl font-bold">{t('auth.title')}</h1>
          <p className="text-text-secondary text-sm mt-2">{t('auth.desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary bg-primary text-bg font-semibold py-2.5 rounded-lg relative z-10 disabled:opacity-50"
          >
            <span className="relative z-10">{loading ? t('auth.loading') : t('auth.login')}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
