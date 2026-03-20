import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // Exchange the code for a session (handles PKCE flow)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        navigate('/command-center')
        return
      }

      if (session) {
        // Check if this user already has a role assigned
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        // If no role yet (first-time Google OAuth user), assign 'user' role
        if (!existingRole) {
          await supabase.from('user_roles').upsert({
            user_id: session.user.id,
            role: 'user',
          }, { onConflict: 'user_id' })
        }

        // Log login activity
        await supabase.from('activity_log').insert({
          user_id: session.user.id,
          action: 'login',
          metadata: { method: 'google' },
        })
      }

      navigate('/command-center')
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary text-sm font-mono">Completing sign in...</p>
      </div>
    </div>
  )
}
