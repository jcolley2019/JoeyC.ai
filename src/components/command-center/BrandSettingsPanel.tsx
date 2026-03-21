import { useState, useEffect, useCallback, useRef } from 'react'
import { ColorPicker } from './ColorPicker'
import type { BrandProfile, StylePreset } from '../../types'

interface BrandSettingsPanelProps {
  open: boolean
  onClose: () => void
  profile: BrandProfile | null
  onSave: (updates: Partial<BrandProfile>) => Promise<void>
  onUploadLogo: (file: File) => Promise<string | null>
}

const STYLE_PRESETS: { id: StylePreset; label: string; font: string; fontFamily: string; accent: string }[] = [
  { id: 'modern', label: 'Modern', font: 'Inter', fontFamily: '"Inter", sans-serif', accent: '#2563eb' },
  { id: 'luxury', label: 'Luxury', font: 'Cormorant Garamond', fontFamily: '"Cormorant Garamond", Georgia, serif', accent: '#c9a84c' },
  { id: 'editorial', label: 'Editorial', font: 'Playfair Display', fontFamily: '"Playfair Display", Georgia, serif', accent: '#dc2626' },
  { id: 'tech', label: 'Tech', font: 'DM Sans', fontFamily: '"DM Sans", sans-serif', accent: '#7c3aed' },
]

export function BrandSettingsPanel({ open, onClose, profile, onSave, onUploadLogo }: BrandSettingsPanelProps) {
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state — initialized from profile
  const [displayName, setDisplayName] = useState('')
  const [titleField, setTitleField] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [instagram, setInstagram] = useState('')
  const [pinterest, setPinterest] = useState('')
  const [youtube, setYoutube] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [stylePreset, setStylePreset] = useState<StylePreset>('modern')
  const [accentColor, setAccentColor] = useState('#2563eb')
  const [hasBrandingKit, setHasBrandingKit] = useState(false)
  const [brandKitNotes, setBrandKitNotes] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Populate form from profile
  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setTitleField(profile.title ?? '')
    setBio(profile.bio ?? '')
    setWebsiteUrl(profile.website_url ?? '')
    setTiktok(profile.tiktok_handle ?? '')
    setInstagram(profile.instagram_handle ?? '')
    setPinterest(profile.pinterest_handle ?? '')
    setYoutube(profile.youtube_handle ?? '')
    setLinkedin(profile.linkedin_handle ?? '')
    setStylePreset(profile.style_preset)
    setAccentColor(profile.accent_color)
    setHasBrandingKit(profile.has_branding_kit)
    setBrandKitNotes(profile.brand_kit_notes ?? '')
    setLogoUrl(profile.logo_url)
  }, [profile, open])

  // Animate
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await onSave({
        display_name: displayName.trim() || null,
        title: titleField.trim() || null,
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        tiktok_handle: tiktok.trim() || null,
        instagram_handle: instagram.trim() || null,
        pinterest_handle: pinterest.trim() || null,
        youtube_handle: youtube.trim() || null,
        linkedin_handle: linkedin.trim() || null,
        style_preset: stylePreset,
        accent_color: accentColor,
        has_branding_kit: hasBrandingKit,
        brand_kit_notes: brandKitNotes.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [displayName, titleField, bio, websiteUrl, tiktok, instagram, pinterest, youtube, linkedin, stylePreset, accentColor, hasBrandingKit, brandKitNotes, onSave])

  const handleLogoUpload = async (file: File) => {
    setUploading(true)
    const url = await onUploadLogo(file)
    if (url) setLogoUrl(url)
    setUploading(false)
  }

  if (!open) return null

  const inputClass = 'w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors'
  const labelClass = 'block text-[11px] font-mono text-[#8892a4] uppercase tracking-wider mb-1'

  return (
    <div
      className={`fixed inset-0 z-[90] transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-[#0a0a1a] border-l border-[#1e2a4a] shadow-2xl shadow-black/50 flex flex-col transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2a4a]">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#4a6fa5]">// brand profile</p>
            <h2 className="text-lg font-semibold text-white mt-0.5">Brand Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#8892a4] hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Live preview */}
          {(displayName || titleField || bio) && (
            <section className="rounded-lg border border-[#1e2a4a] bg-[#0c1020] p-4">
              <span className="text-[10px] font-mono text-[#8892a4] uppercase tracking-widest">Preview</span>
              <div className="flex items-start gap-3 mt-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-10 h-10 rounded-md object-contain shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[#1e2a4a] shrink-0 flex items-center justify-center text-[#8892a4] text-lg">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{displayName || 'Your Name'}</span>
                    {titleField && <span className="text-[12px] text-[#8892a4] italic">{titleField}</span>}
                  </div>
                  {websiteUrl && <span className="text-[11px] text-[#4a6fa5] block mt-0.5">{websiteUrl}</span>}
                  {bio && <p className="text-[12px] text-[#a0aac0] mt-1 leading-relaxed line-clamp-2">{bio}</p>}
                  {(tiktok || instagram || pinterest || youtube || linkedin) && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[#8892a4] font-mono">
                      {[tiktok && 'TikTok', instagram && 'Instagram', pinterest && 'Pinterest', youtube && 'YouTube', linkedin && 'LinkedIn'].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Identity */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-mono font-semibold text-white uppercase tracking-wider">Identity</h3>
            <div>
              <label className={labelClass}>Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input type="text" value={titleField} onChange={e => setTitleField(e.target.value)} placeholder="AI Builder, Travel Creator..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bio <span className="text-[#64748b]">({bio.length}/280)</span></label>
              <textarea value={bio} onChange={e => { if (e.target.value.length <= 280) setBio(e.target.value) }} placeholder="Short bio..." rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" className={inputClass} />
            </div>
          </section>

          {/* Logo */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-mono font-semibold text-white uppercase tracking-wider">Logo</h3>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-contain border border-[#1e2a4a] bg-[#0c1020]" />
              ) : (
                <div className="w-14 h-14 rounded-lg border border-dashed border-[#1e2a4a] bg-[#0c1020] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-xs font-mono border border-[#1e2a4a] rounded-md text-[#8892a4] hover:text-white hover:border-[#4a6fa5]/40 transition-colors"
              >
                {uploading ? 'Uploading...' : logoUrl ? 'Change' : 'Upload'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
              />
            </div>
          </section>

          {/* Social Handles */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-mono font-semibold text-white uppercase tracking-wider">Social Handles</h3>
            {([
              { label: 'TikTok', value: tiktok, set: setTiktok },
              { label: 'Instagram', value: instagram, set: setInstagram },
              { label: 'Pinterest', value: pinterest, set: setPinterest },
              { label: 'YouTube', value: youtube, set: setYoutube },
              { label: 'LinkedIn', value: linkedin, set: setLinkedin },
            ]).map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#8892a4] w-16 shrink-0">{s.label}</span>
                <input type="text" value={s.value} onChange={e => s.set(e.target.value)} placeholder={`@handle`} className={`flex-1 ${inputClass}`} />
              </div>
            ))}
          </section>

          {/* Style */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-mono font-semibold text-white uppercase tracking-wider">Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setStylePreset(p.id); setAccentColor(p.accent) }}
                  className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                    stylePreset === p.id
                      ? 'border-[#4a6fa5] bg-[#4a6fa5]/15'
                      : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40'
                  }`}
                >
                  <span className="text-[14px] font-semibold text-white" style={{ fontFamily: p.fontFamily }}>{p.label}</span>
                  <span className="text-[10px] text-[#8892a4]">{p.font}</span>
                </button>
              ))}
            </div>
            <ColorPicker value={accentColor} onChange={setAccentColor} label="Accent Color" />
          </section>

          {/* Brand Kit */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-mono font-semibold text-white uppercase tracking-wider">Brand Kit</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHasBrandingKit(!hasBrandingKit)}
                className={`w-10 h-5 rounded-full transition-all duration-200 ${
                  hasBrandingKit ? 'bg-[#4a6fa5]' : 'bg-[#1e2a4a]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  hasBrandingKit ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="text-sm text-[#a0aac0]">I have a branding kit</span>
            </div>
            {hasBrandingKit && (
              <div>
                <label className={labelClass}>Brand Kit Notes</label>
                <textarea value={brandKitNotes} onChange={e => setBrandKitNotes(e.target.value)} placeholder="Brand guidelines, voice notes, color codes..." rows={3} className={`${inputClass} resize-none`} />
              </div>
            )}
          </section>
        </div>

        {/* Fixed save button */}
        <div className="px-5 py-4 border-t border-[#1e2a4a]">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              saved
                ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                : saving
                  ? 'bg-[#1e2a4a] text-[#64748b] cursor-not-allowed'
                  : 'bg-[#4a6fa5] text-white hover:bg-[#5a82bd] shadow-lg shadow-[#4a6fa5]/20'
            }`}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
