import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { supabase } from '../../lib/supabase'

interface AuthGateProps {
  onLogin: (email: string, password: string) => Promise<void>
  onSignUp?: (email: string, password: string) => Promise<void>
  onGoogleSignIn?: () => Promise<void>
  children: React.ReactNode
  isAuthenticated: boolean
}

export function AuthGate({ onLogin, onSignUp, onGoogleSignIn, children, isAuthenticated }: AuthGateProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  if (isAuthenticated) return <>{children}</>

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup' && onSignUp) {
        await onSignUp(email, password)
        // After sign up, assign 'user' role
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.from('user_roles').upsert({
            user_id: session.user.id,
            role: 'user',
          }, { onConflict: 'user_id' })
        }
        setSignUpSuccess(true)
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

  const handleGoogle = async () => {
    if (!onGoogleSignIn) return
    setError('')
    try {
      await onGoogleSignIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    }
  }

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary text-sm">
            We sent a confirmation link to <strong className="text-text-primary">{email}</strong>. Click the link to activate your account.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setMode('login') }}
            className="mt-6 text-primary text-sm hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold mt-3">{mode === 'login' ? t('auth.title') : 'Create Account'}</h1>
          <p className="text-text-secondary text-sm mt-2">
            {mode === 'login' ? t('auth.desc') : 'Sign up to access the content studio'}
          </p>
        </div>

        {/* Google OAuth */}
        {onGoogleSignIn && (
          <>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary hover:border-border-hover transition-colors mb-4"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-secondary font-mono">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
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
            <span className="relative z-10">
              {loading ? t('auth.loading') : mode === 'login' ? t('auth.login') : 'Create Account'}
            </span>
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary mt-4">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} className="text-primary hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-primary hover:underline">
                Log in
              </button>
            </>
          )}
        </p>

        <div className="text-center mt-6 pt-6 border-t border-border">
          <a
            href="/"
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ← Back to <span className="notranslate" translate="no">JoeyC.ai</span>
          </a>
        </div>
      </div>
    </div>
  )
}
