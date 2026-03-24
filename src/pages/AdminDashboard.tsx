import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { supabase } from '../lib/supabase'
import { brand, emailTemplates } from '../lib/brand'
import type { Invitation, ActivityLogEntry } from '../types'

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  role: string | null
}

export function AdminDashboard() {
  const { session, loading: authLoading, logout } = useAuth()
  const { isMasterAdmin, loading: adminLoading } = useAdmin()
  const navigate = useNavigate()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  // Tab
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'invitations' | 'brand'>('users')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState<'invitation' | 'confirmation' | 'resetPassword' | 'magicLink'>('invitation')
  const emailPreviewRef = useRef<HTMLIFrameElement>(null)

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoadingData(true)

    try {
      // Fetch users + activity via edge function (needs service role for auth.users)
      const { data: adminData, error: adminErr } = await supabase.functions.invoke('admin-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (adminErr) throw adminErr

      if (adminData?.users) setUsers(adminData.users)
      if (adminData?.activity) setActivity(adminData.activity)

      // Fetch invitations directly (RLS allows master_admin)
      const { data: invData } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (invData) setInvitations(invData as Invitation[])
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }, [session])

  useEffect(() => {
    if (!authLoading && !adminLoading && isMasterAdmin) {
      fetchData()
    }
  }, [authLoading, adminLoading, isMasterAdmin, fetchData])

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!session || !isMasterAdmin) {
        navigate('/')
      }
    }
  }, [authLoading, adminLoading, session, isMasterAdmin, navigate])

  const handleDeleteInvite = async (id: string) => {
    if (!session) return
    await supabase.from('invitations').delete().eq('id', id)
    setInvitations(prev => prev.filter(inv => inv.id !== id))
  }

  const handleClearAllInvites = async () => {
    if (!session || invitations.length === 0) return
    await supabase.from('invitations').delete().in('id', invitations.map(inv => inv.id))
    setInvitations([])
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !session) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email: inviteEmail.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchData()
      setTimeout(() => setInviteSuccess(''), 3000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session || !isMasterAdmin) return null

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const formatAction = (entry: ActivityLogEntry) => {
    const m = entry.metadata
    if (entry.action === 'login') {
      return `Logged in via ${m.method || 'unknown'}`
    }
    if (entry.action === 'signup') {
      return `Signed up via ${m.method || 'email'}`
    }
    if (entry.action === 'content_generation') {
      const parts: string[] = []
      if (m.input_type) parts.push(`Input: ${m.input_type}`)
      if (m.output_format) parts.push(`Format: ${m.output_format}`)
      if (m.platform) parts.push(`Platform: ${m.platform}`)
      if (m.cascade) parts.push('(cascade)')
      return parts.join(' · ') || 'Content generated'
    }
    return entry.action
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary">
              // admin dashboard
            </p>
            <h1 className="text-xl font-bold mt-1">Master Control</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/command-center"
              className="px-3 py-1.5 text-xs font-mono border border-border rounded-md text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              Content Studio
            </a>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-mono border border-border rounded-md text-text-secondary hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Invite Section */}
        <div className="mb-8 p-6 rounded-xl border border-border bg-bg-card">
          <h2 className="font-semibold text-text-primary mb-1">Invite User</h2>
          <p className="text-[14px] text-[#94a3b8] mb-4">Send an email invitation to give someone access to the content studio.</p>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-[#64748b] focus:outline-none focus:border-primary transition-colors text-[14px]"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-6 py-2.5 bg-primary text-bg font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-hover transition-colors text-sm"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
          {inviteSuccess && <p className="text-green-400 text-[14px] font-semibold font-mono mt-2">{inviteSuccess}</p>}
          {inviteError && <p className="text-red-400 text-xs font-mono mt-2">{inviteError}</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg-card border border-border rounded-lg p-1 mb-6">
          {(['users', 'activity', 'invitations', 'brand'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-md text-[15px] font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'border-primary bg-primary/10 text-white'
                  : 'text-[#94a3b8] hover:text-text-primary border border-transparent'
              }`}
            >
              {tab === 'brand' ? 'Brand Kit' : tab} {tab === 'users' && users.length > 0 && `(${users.length})`}
              {tab === 'activity' && activity.length > 0 && `(${activity.length})`}
              {tab === 'invitations' && invitations.length > 0 && `(${invitations.length})`}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-card border-b border-border">
                      <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Email</th>
                      <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Role</th>
                      <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Joined</th>
                      <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-bg-card/50 transition-colors">
                        <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[12px] font-mono ${
                            user.role === 'master_admin'
                              ? 'bg-[#1e4d2b] text-white border border-green-600/40'
                              : 'bg-[#1e3a5f] text-white border border-blue-500/40'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{formatDate(user.last_sign_in_at)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-text-secondary text-sm">No users yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-2">
                {activity.map(entry => (
                  <div key={entry.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-bg-card hover:border-border-hover transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      entry.action === 'login' ? 'bg-green-500/15 text-green-400' :
                      entry.action === 'signup' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-primary/15 text-primary'
                    }`}>
                      {entry.action === 'login' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                        </svg>
                      )}
                      {entry.action === 'signup' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                      )}
                      {entry.action === 'content_generation' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] text-[#e2e8f0] font-medium truncate">{entry.user_email || 'Unknown user'}</span>
                        <span className="text-[13px] text-[#94a3b8]">{formatDate(entry.created_at)}</span>
                      </div>
                      <p className="text-[13px] text-[#94a3b8] mt-0.5">{formatAction(entry)}</p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <p className="text-text-secondary text-sm">No activity recorded yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Brand Kit Tab */}
            {activeTab === 'brand' && (
              <div className="space-y-8">

                {/* Brand Identity */}
                <div className="rounded-xl border border-border bg-bg-card p-6">
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// Brand Identity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[13px] text-text-secondary mb-1">Brand Name</p>
                      <p className="text-[15px] text-text-primary font-semibold" style={{ fontFamily: brand.fonts.display }}>{brand.name}</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-text-secondary mb-1">Tagline</p>
                      <p className="text-[15px] text-text-primary">{brand.tagline}</p>
                    </div>
                    <div>
                      <p className="text-[13px] text-text-secondary mb-1">URL</p>
                      <p className="text-[15px] text-primary">{brand.url}</p>
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="rounded-xl border border-border bg-bg-card p-6">
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// Colors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(brand.colors).map(([name, hex]) => (
                      <button
                        key={name}
                        onClick={() => {
                          navigator.clipboard.writeText(hex)
                          setCopiedField(name)
                          setTimeout(() => setCopiedField(null), 1500)
                        }}
                        className="group text-left p-3 rounded-lg border border-border hover:border-primary/30 transition-all"
                      >
                        <div
                          className="w-full h-10 rounded-md mb-2 border border-white/10"
                          style={{ backgroundColor: hex }}
                        />
                        <p className="text-[12px] text-text-secondary capitalize">
                          {name.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-[13px] font-mono text-text-primary group-hover:text-primary transition-colors">
                          {copiedField === name ? 'Copied!' : hex}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="rounded-xl border border-border bg-bg-card p-6">
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// Typography</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-[12px] font-mono text-text-secondary mb-2">Display — {brand.fonts.display}</p>
                      <p className="text-2xl text-text-primary" style={{ fontFamily: brand.fonts.display, fontWeight: 700 }}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-[12px] font-mono text-text-secondary mb-2">Body — {brand.fonts.body}</p>
                      <p className="text-lg text-text-primary" style={{ fontFamily: brand.fonts.body }}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-[12px] font-mono text-text-secondary mb-2">Mono — {brand.fonts.mono}</p>
                      <p className="text-base text-text-primary" style={{ fontFamily: brand.fonts.mono }}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(brand.fontsUrl)
                          setCopiedField('fontsUrl')
                          setTimeout(() => setCopiedField(null), 1500)
                        }}
                        className="text-[13px] font-mono text-text-secondary hover:text-primary transition-colors"
                      >
                        {copiedField === 'fontsUrl' ? '✓ Copied Google Fonts URL' : '📋 Copy Google Fonts import URL'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="rounded-xl border border-border bg-bg-card p-6">
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-2">// Email Templates</h3>
                  <p className="text-[13px] text-text-secondary mb-4">
                    Copy these into Supabase → Authentication → Email Templates
                  </p>

                  {/* Template selector */}
                  <div className="flex gap-1 bg-bg border border-border rounded-lg p-1 mb-4">
                    {(['invitation', 'confirmation', 'resetPassword', 'magicLink'] as const).map(tmpl => (
                      <button
                        key={tmpl}
                        onClick={() => setEmailPreview(tmpl)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-[12px] font-mono transition-all capitalize ${
                          emailPreview === tmpl
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'text-text-secondary hover:text-text-primary border border-transparent'
                        }`}
                      >
                        {tmpl.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="rounded-lg border border-border overflow-hidden mb-4" style={{ height: 480 }}>
                    <iframe
                      ref={emailPreviewRef}
                      srcDoc={emailTemplates[emailPreview]}
                      title="Email preview"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin"
                    />
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(emailTemplates[emailPreview])
                      setCopiedField('email')
                      setTimeout(() => setCopiedField(null), 2000)
                    }}
                    className="px-4 py-2 bg-primary text-bg font-semibold rounded-lg text-sm hover:bg-primary-hover transition-colors"
                  >
                    {copiedField === 'email' ? '✓ HTML Copied!' : `Copy ${emailPreview.replace(/([A-Z])/g, ' $1').trim()} HTML`}
                  </button>
                </div>

              </div>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invitations' && (
              <div>
                {invitations.length > 0 && (
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={handleClearAllInvites}
                      className="px-3 py-1.5 text-xs font-mono border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      Clear All Invitations
                    </button>
                  </div>
                )}
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-card border-b border-border">
                        <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Email</th>
                        <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Status</th>
                        <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Sent</th>
                        <th className="text-left px-4 py-3 font-mono text-[13px] font-bold text-white uppercase tracking-[0.08em]">Accepted</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map(inv => (
                        <tr key={inv.id} className="border-b border-border/50 hover:bg-bg-card/50 transition-colors">
                          <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{inv.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[12px] font-mono ${
                              inv.status === 'accepted'
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                : inv.status === 'expired'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-yellow-400/80 text-yellow-900 border border-yellow-500/30'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{formatDate(inv.created_at)}</td>
                          <td className="px-4 py-3 text-[14px] text-[#e2e8f0]">{formatDate(inv.accepted_at)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteInvite(inv.id)}
                              className="text-text-secondary hover:text-red-400 transition-colors"
                              title="Delete invitation"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {invitations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-secondary text-sm">No invitations sent yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
