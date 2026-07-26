import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, initialAuthParams } from '../lib/supabase'
import { PasswordInput } from '../components/ui/PasswordInput'

const MIN_LENGTH = 8

/**
 * Landing page for the Supabase recovery email link.
 *
 * The client strips the recovery token off the URL while it initializes, which
 * can happen before this component mounts — so validity is established three
 * ways: the PASSWORD_RECOVERY event, an explicit PKCE code exchange, and a
 * final getSession() check once initialization has settled.
 */
export function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Supabase bounces expired/consumed links back with an error in the URL.
    if (initialAuthParams.error) {
      setStatus('invalid')
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStatus('ready')
    })

    let cancelled = false

    const verify = async () => {
      if (initialAuthParams.code) {
        // PKCE-style link — the code has to be traded for a session explicitly.
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(initialAuthParams.code)
        if (exchangeError) {
          if (!cancelled) setStatus('invalid')
          return
        }
      }

      // getSession() resolves only after the client has finished parsing the URL.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setStatus(session ? 'ready' : 'invalid')
    }

    verify()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      navigate('/command-center')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setSaving(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-xl tracking-[0.25em] uppercase font-semibold text-primary mb-0">
            // COMMAND CENTER
          </p>
          <p className="font-mono text-lg tracking-[0.15em] text-white font-semibold mb-1">
            Content Studio
          </p>
        </div>
        {children}
      </div>
    </div>
  )

  if (status === 'checking') {
    return shell(
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary text-sm font-mono">Verifying reset link...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return shell(
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">This reset link is invalid or expired</h1>
        <p className="text-text-secondary text-sm mb-6">
          Reset links can only be used once and expire after a short while. Request a fresh one from the login screen.
        </p>
        <a href="/command-center" className="font-mono text-sm text-primary hover:underline">
          ← Back to login
        </a>
      </div>
    )
  }

  return shell(
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Set a New Password</h1>
        <p className="text-text-secondary text-sm mt-2">
          Choose a password of at least {MIN_LENGTH} characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs text-text-secondary mb-1.5">New Password</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            minLength={MIN_LENGTH}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-text-secondary mb-1.5">Confirm Password</label>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            minLength={MIN_LENGTH}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm font-mono">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full btn-primary bg-primary text-bg font-semibold py-2.5 rounded-lg relative z-10 disabled:opacity-50"
        >
          <span className="relative z-10">{saving ? 'Updating...' : 'Update Password'}</span>
        </button>
      </form>

      <div className="text-center mt-6 pt-6 border-t border-border">
        <a href="/command-center" className="text-sm text-text-secondary hover:text-primary transition-colors">
          ← Back to login
        </a>
      </div>
    </>
  )
}
