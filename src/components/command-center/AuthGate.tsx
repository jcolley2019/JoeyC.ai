import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { supabase } from '../../lib/supabase'
import { PasswordInput } from '../ui/PasswordInput'

/** Where Supabase sends the user after they click the recovery email link. */
const RESET_REDIRECT_PATH = '/reset-password'

/**
 * The reset confirmation is deliberately identical whether or not the address is
 * registered — this is invite-only admin access, so the form must not double as
 * a way to probe which emails exist.
 */
const RESET_SENT_MESSAGE = 'If that email has an account, a reset link is on its way.'

/** Only a genuinely failed request is worth surfacing; everything else stays neutral. */
const isNetworkError = (err: { name?: string; message?: string; status?: number } | null) =>
  !!err && (
    err.name === 'AuthRetryableFetchError' ||
    err.status === 0 ||
    /failed to fetch|networkerror|load failed/i.test(err.message ?? '')
  )

/**
 * Login only. There is intentionally no signup form and no OAuth button here
 * (L3-03): accounts are created server-side by the send-invite edge function,
 * and the invitee arrives already signed in through the emailed invite link.
 * Registration is also closed at the Supabase Auth level, so nothing in this
 * component is what keeps strangers out — it just has no path to try.
 */
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
  const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>('login')

  if (isAuthenticated) return <>{children}</>

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${RESET_REDIRECT_PATH}`,
        })
        if (isNetworkError(resetError)) {
          setError('Could not reach the server. Check your connection and try again.')
          return
        }
        setMode('sent')
      } else {
        await onLogin(email, password)
        // Log login activity
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('activity_log').insert({
            user_id: session.user.id,
            action: 'login',
            metadata: { method: 'password' },
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const heading = mode === 'forgot' ? 'Reset Password'
    : mode === 'sent' ? 'Check your email'
    : t('auth.title')

  const subheading = mode === 'forgot' ? 'Enter your email and we’ll send you a reset link.'
    : mode === 'sent' ? RESET_SENT_MESSAGE
    : t('auth.desc')

  const backToLogin = () => { setMode('login'); setError('') }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-xl tracking-[0.25em] uppercase font-semibold text-primary mb-0">
            // COMMAND CENTER
          </p>
          <p className="font-mono text-lg tracking-[0.15em] text-white font-semibold mb-1">
            Content Studio
          </p>
          <h1 className="text-2xl font-bold mt-3">{heading}</h1>
          <p className="text-text-secondary text-sm mt-2">{subheading}</p>
        </div>

        {mode === 'sent' ? (
          <button
            onClick={backToLogin}
            className="w-full font-mono text-sm text-primary hover:underline"
          >
            ← Back to login
          </button>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.email')}</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label htmlFor="auth-password" className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.password')}</label>
              <PasswordInput
                id="auth-password"
                name="password"
                value={password}
                onChange={setPassword}
                minLength={6}
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError('') }}
                  className="font-mono text-xs text-text-secondary hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary bg-primary text-bg font-semibold py-2.5 rounded-lg relative z-10 disabled:opacity-50"
          >
            <span className="relative z-10">
              {loading
                ? (mode === 'forgot' ? 'Sending...' : t('auth.loading'))
                : mode === 'forgot' ? 'Send Reset Link'
                : t('auth.login')}
            </span>
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={backToLogin}
              className="block w-full text-center font-mono text-xs text-text-secondary/70 hover:text-primary transition-colors"
            >
              ← Back to login
            </button>
          )}
        </form>
        )}

        {mode === 'login' && (
          <p className="text-center text-xs text-text-secondary mt-4">
            <span className="text-text-secondary">Invite only — request access from the admin</span>
          </p>
        )}

        <div className="text-center mt-6 pt-6 border-t border-border">
          <a
            href="/"
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to JoeyC.ai
          </a>
        </div>
      </div>
    </div>
  )
}
