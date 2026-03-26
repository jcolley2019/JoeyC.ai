import { useState, useEffect, useCallback, useRef } from 'react'
import { ColorPicker } from './ColorPicker'
import type { StylePreset } from '../../types'

type AssetChoice = 'full-kit' | 'logo-only' | 'none'

interface OnboardingWizardProps {
  open: boolean
  onComplete: (data: OnboardingData) => Promise<void> | void
  onSkip: () => void
  onThemeChange?: (theme: 'dark' | 'luxe') => void
}

export interface OnboardingData {
  display_name: string
  title: string
  bio: string
  website_url: string
  tiktok_handle: string
  instagram_handle: string
  pinterest_handle: string
  youtube_handle: string
  linkedin_handle: string
  style_preset: StylePreset
  accent_color: string
  has_branding_kit: boolean
  brand_kit_notes: string
  logoFile: File | null
}

const STYLE_PRESETS: { id: StylePreset; label: string; font: string; fontFamily: string; accent: string; feel: string }[] = [
  { id: 'modern', label: 'Modern', font: 'Inter', fontFamily: '"Inter", sans-serif', accent: '#2563eb', feel: 'Clean, minimal, professional' },
  { id: 'luxury', label: 'Luxury', font: 'Cormorant Garamond', fontFamily: '"Cormorant Garamond", Georgia, serif', accent: '#c9a84c', feel: 'Elegant, high-end, editorial' },
  { id: 'editorial', label: 'Editorial', font: 'Playfair Display', fontFamily: '"Playfair Display", Georgia, serif', accent: '#dc2626', feel: 'Magazine-style, authoritative' },
  { id: 'tech', label: 'Tech', font: 'DM Sans', fontFamily: '"DM Sans", sans-serif', accent: '#7c3aed', feel: 'Sharp, direct, modern tech' },
]

// Theme colors for wizard's own rendering (not inherited from parent)
const DARK_THEME = {
  bg: '#0d1117',
  card: '#161b22',
  input: '#0d1117',
  text: '#ffffff',
  textSecondary: '#8892a4',
  accent: '#1a8fff',
  border: 'rgba(74, 111, 165, 0.3)',
  borderHover: 'rgba(74, 111, 165, 0.5)',
  button: '#2563eb',
  buttonHover: '#3b82f6',
  progressBg: '#1e2a4a',
  progressFill: '#1a8fff',
}
const LUXE_THEME = {
  bg: '#faf7f2',
  card: '#f0ebe3',
  input: '#ffffff',
  text: '#1a1008',
  textSecondary: '#3d2b1f',
  accent: '#c9a84c',
  border: 'rgba(184, 134, 11, 0.3)',
  borderHover: 'rgba(184, 134, 11, 0.5)',
  button: '#b8860b',
  buttonHover: '#d4a017',
  progressBg: '#e0d5c4',
  progressFill: '#c9a84c',
}

export function OnboardingWizard({ open, onComplete, onSkip, onThemeChange }: OnboardingWizardProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [themeChoice, setThemeChoice] = useState<'dark' | 'luxe'>('dark')

  // Theme-driven colors
  const t = themeChoice === 'luxe' ? LUXE_THEME : DARK_THEME

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [titleField, setTitleField] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [assetChoice, setAssetChoice] = useState<AssetChoice | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState('#2563eb')
  const [brandKitNotes, setBrandKitNotes] = useState('')
  const [stylePreset, setStylePreset] = useState<StylePreset>('modern')

  // Social handles
  const [tiktok, setTiktok] = useState('')
  const [instagram, setInstagram] = useState('')
  const [pinterest, setPinterest] = useState('')
  const [youtube, setYoutube] = useState('')
  const [linkedin, setLinkedin] = useState('')

  // Drag state for logo upload
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Animate in
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0)
      setAssetChoice(null)
    }
  }, [open])

  // ESC to skip
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onSkip])

  // Determine steps based on asset choice — Theme is always first
  const getSteps = useCallback((): string[] => {
    if (!assetChoice) return ['Theme', 'Welcome', 'Assets']
    if (assetChoice === 'full-kit') return ['Theme', 'Welcome', 'Assets', 'Brand Kit', 'Socials', 'Style']
    if (assetChoice === 'logo-only') return ['Theme', 'Welcome', 'Assets', 'Logo', 'Socials', 'Style']
    return ['Theme', 'Welcome', 'Assets', 'Socials', 'Style']
  }, [assetChoice])

  const steps = getSteps()
  const totalSteps = steps.length

  // Handle logo file selection
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleLogoFile(file)
  }

  // When style preset changes, set default accent
  const handlePresetChange = (preset: StylePreset) => {
    setStylePreset(preset)
    const p = STYLE_PRESETS.find(s => s.id === preset)
    if (p) setAccentColor(p.accent)
  }

  const handleThemeSelect = (theme: 'dark' | 'luxe') => {
    setThemeChoice(theme)
    try { localStorage.setItem('cc-theme', theme === 'luxe' ? 'luxe' : 'dark') } catch {}
    onThemeChange?.(theme)
  }

  const canAdvance = useCallback(() => {
    const label = steps[step]
    if (label === 'Theme') return true // always has a default selection
    if (label === 'Welcome') return displayName.trim().length > 0
    if (label === 'Assets') return assetChoice !== null
    if (label === 'Brand Kit' || label === 'Logo') return true // optional
    if (label === 'Socials') return true // skippable
    if (label === 'Style') return stylePreset !== null
    return true
  }, [step, displayName, assetChoice, steps, stylePreset])

  const handleNext = async () => {
    if (!canAdvance() || saving) return
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      // Complete — show loading state
      setSaving(true)
      try {
        await onComplete({
          display_name: displayName.trim(),
          title: titleField.trim(),
          bio: bio.trim(),
          website_url: websiteUrl.trim(),
          tiktok_handle: tiktok.trim(),
          instagram_handle: instagram.trim(),
          pinterest_handle: pinterest.trim(),
          youtube_handle: youtube.trim(),
          linkedin_handle: linkedin.trim(),
          style_preset: stylePreset,
          accent_color: accentColor,
          has_branding_kit: assetChoice === 'full-kit',
          brand_kit_notes: brandKitNotes.trim(),
          logoFile,
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!open) return null

  const isLastStep = step === totalSteps - 1
  const currentLabel = steps[step]

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ fontFamily: '"Space Grotesk", sans-serif' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} />

      {/* Modal — uses inline styles to avoid luxe-mode CSS inheritance */}
      <div
        className={`relative w-full max-w-[560px] mx-4 rounded-xl shadow-2xl transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          backgroundColor: t.bg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: t.border,
          color: t.text,
        }}
      >
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[11px] font-mono" style={{ color: t.textSecondary }}>Step {step + 1} of {totalSteps}</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: t.progressBg }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%`, backgroundColor: t.progressFill }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[380px] flex flex-col">

          {/* STEP: Theme — Choose dark or luxe */}
          {currentLabel === 'Theme' && (
            <div className="flex-1 flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-1" style={{ color: t.text }}>Choose your experience</h2>
                <p className="text-[13px]" style={{ color: t.textSecondary }}>You can change this anytime</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Dark Mode card */}
                <button
                  onClick={() => handleThemeSelect('dark')}
                  className="flex flex-col items-center rounded-xl p-5 transition-all duration-300"
                  style={{
                    border: `2px solid ${themeChoice === 'dark' ? '#1a8fff' : t.border}`,
                    backgroundColor: themeChoice === 'dark' ? 'rgba(26, 143, 255, 0.08)' : 'transparent',
                  }}
                >
                  <div
                    className="w-full h-20 rounded-lg mb-3 flex items-center justify-center text-3xl"
                    style={{ backgroundColor: '#0d1117', border: '1px solid rgba(74, 111, 165, 0.3)' }}
                  >
                    🌙
                  </div>
                  <span className="text-[15px] font-semibold" style={{ color: t.text }}>Dark Mode</span>
                  <span className="text-[12px] mt-0.5" style={{ color: t.textSecondary }}>Sleek, modern, high contrast</span>
                </button>

                {/* Luxe Mode card */}
                <button
                  onClick={() => handleThemeSelect('luxe')}
                  className="flex flex-col items-center rounded-xl p-5 transition-all duration-300"
                  style={{
                    border: `2px solid ${themeChoice === 'luxe' ? '#c9a84c' : t.border}`,
                    backgroundColor: themeChoice === 'luxe' ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
                  }}
                >
                  <div
                    className="w-full h-20 rounded-lg mb-3 flex items-center justify-center text-3xl"
                    style={{ backgroundColor: '#faf7f2', border: '1px solid rgba(184, 134, 11, 0.3)' }}
                  >
                    ✨
                  </div>
                  <span className="text-[15px] font-semibold" style={{ color: t.text }}>Luxe Mode</span>
                  <span className="text-[12px] mt-0.5" style={{ color: t.textSecondary }}>Warm, elegant, gold accents</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP: Welcome — Name + Title + Bio */}
          {currentLabel === 'Welcome' && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: t.accent }}>// brand profile</p>
                <h2 className="text-xl font-semibold mb-1" style={{ color: t.text }}>Welcome to Content Studio</h2>
                <p className="text-[13px]" style={{ color: t.textSecondary }}>Set up your brand profile to personalize your generated content.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Display Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Joey Colley"
                    autoFocus
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Title</label>
                  <input
                    type="text"
                    value={titleField}
                    onChange={e => setTitleField(e.target.value)}
                    placeholder='e.g. "AI Builder", "Travel Creator"'
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>
                    Bio <span style={{ color: t.textSecondary }}>({bio.length}/280)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => { if (e.target.value.length <= 280) setBio(e.target.value) }}
                    placeholder="A short bio about you and what you do..."
                    rows={3}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none"
                    style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Website</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Assets — Choose branding level */}
          {currentLabel === 'Assets' && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>Do you have brand assets?</h2>
              <p className="text-[13px] mb-5" style={{ color: t.textSecondary }}>This helps us tailor your setup experience.</p>
              <div className="flex flex-col gap-3">
                {([
                  { id: 'full-kit' as AssetChoice, label: 'Yes, I have a full brand kit', desc: 'Logo, brand colors, guidelines' },
                  { id: 'logo-only' as AssetChoice, label: 'I have a logo', desc: 'Just a logo, no formal brand guidelines' },
                  { id: 'none' as AssetChoice, label: 'No branding yet', desc: "We'll help you pick a style" },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAssetChoice(opt.id)}
                    className="flex flex-col items-start px-5 py-4 rounded-lg transition-all duration-200 text-left"
                    style={{
                      border: `2px solid ${assetChoice === opt.id ? t.accent : t.border}`,
                      backgroundColor: assetChoice === opt.id ? `${t.accent}15` : t.card,
                    }}
                  >
                    <span className="text-[14px] font-medium" style={{ color: assetChoice === opt.id ? t.text : t.textSecondary }}>
                      {opt.label}
                    </span>
                    <span className="text-[12px] mt-0.5" style={{ color: t.textSecondary }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Brand Kit — Logo + colors + notes */}
          {currentLabel === 'Brand Kit' && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>Upload your brand assets</h2>

              {/* Logo upload */}
              <div>
                <label className="block text-[12px] font-mono uppercase tracking-wider mb-2" style={{ color: t.textSecondary }}>Logo</label>
                <div
                  onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
                  onDragLeave={e => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: dragOver ? t.accent : t.border,
                    backgroundColor: dragOver ? `${t.accent}15` : t.card,
                    color: t.textSecondary,
                  }}
                >
                  {logoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-md object-contain" />
                      <span className="text-sm" style={{ color: t.textSecondary }}>{logoFile?.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm">Drop your logo here or click to browse</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
                  />
                </div>
              </div>

              <ColorPicker value={accentColor} onChange={setAccentColor} label="Brand Accent Color" />

              <div>
                <label className="block text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: t.textSecondary }}>Brand Guidelines / Notes</label>
                <textarea
                  value={brandKitNotes}
                  onChange={e => setBrandKitNotes(e.target.value)}
                  placeholder="Any brand voice guidelines, tone preferences, color codes..."
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none"
                  style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                />
              </div>
            </div>
          )}

          {/* STEP: Logo — Logo upload only */}
          {currentLabel === 'Logo' && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>Upload your logo</h2>
              <p className="text-[13px]" style={{ color: t.textSecondary }}>This will appear on your branded blog posts.</p>

              <div
                onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
                onDragLeave={e => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg px-4 py-10 text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragOver ? t.accent : t.border,
                  backgroundColor: dragOver ? `${t.accent}15` : t.card,
                  color: t.textSecondary,
                }}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-md object-contain" />
                    <span className="text-sm" style={{ color: t.textSecondary }}>{logoFile?.name}</span>
                    <span className="text-xs" style={{ color: t.textSecondary }}>Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: t.textSecondary }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-sm">Drop your logo here or click to browse</span>
                    <span className="text-xs" style={{ opacity: 0.6 }}>PNG, JPG, SVG up to 5MB</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
                />
              </div>
            </div>
          )}

          {/* STEP: Socials — Social handles */}
          {currentLabel === 'Socials' && (
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>Social handles</h2>
                <p className="text-[13px] mb-4" style={{ color: t.textSecondary }}>These will be linked in your author bio. All optional.</p>
              </div>
              {([
                { label: 'TikTok', value: tiktok, set: setTiktok, placeholder: '@yourhandle' },
                { label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@yourhandle' },
                { label: 'Pinterest', value: pinterest, set: setPinterest, placeholder: '@yourhandle' },
                { label: 'YouTube', value: youtube, set: setYoutube, placeholder: '@yourchannel' },
                { label: 'LinkedIn', value: linkedin, set: setLinkedin, placeholder: 'your-profile' },
              ]).map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[12px] font-mono w-20 shrink-0" style={{ color: t.textSecondary }}>{s.label}</span>
                  <input
                    type="text"
                    value={s.value}
                    onChange={e => s.set(e.target.value)}
                    placeholder={s.placeholder}
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* STEP: Style — Preset + accent color */}
          {currentLabel === 'Style' && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: t.text }}>Choose your style</h2>
                <p className="text-[13px]" style={{ color: t.textSecondary }}>This sets the tone and typography for your blog posts.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetChange(p.id)}
                    className="flex flex-col items-start p-4 rounded-lg transition-all duration-200 text-left"
                    style={{
                      border: `2px solid ${stylePreset === p.id ? t.accent : t.border}`,
                      backgroundColor: stylePreset === p.id ? `${t.accent}15` : t.card,
                    }}
                  >
                    <span
                      className="text-[18px] font-semibold mb-1 leading-tight"
                      style={{ fontFamily: p.fontFamily, color: t.text }}
                    >
                      {p.label}
                    </span>
                    <span className="text-[11px] mb-2" style={{ color: t.textSecondary }}>{p.font}</span>
                    <span
                      className="text-[13px] leading-snug"
                      style={{ fontFamily: p.fontFamily, color: t.textSecondary }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      <span className="text-[10px] font-mono" style={{ color: t.textSecondary }}>{p.feel}</span>
                    </div>
                  </button>
                ))}
              </div>

              <ColorPicker value={accentColor} onChange={setAccentColor} label="Customize Accent Color" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-mono transition-colors"
                  style={{ color: t.textSecondary }}
                >
                  Back
                </button>
              )}
              <button
                onClick={() => onSkip && onSkip()}
                className="px-4 py-2 text-sm font-mono transition-colors hover:opacity-80"
                style={{ color: t.textSecondary }}
              >
                Skip for now
              </button>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8,
                  backgroundColor: i === step ? t.accent : i < step ? `${t.accent}80` : t.progressBg,
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
            style={{
              backgroundColor: canAdvance() && !saving ? t.button : t.progressBg,
              color: canAdvance() && !saving ? '#ffffff' : t.textSecondary,
              cursor: canAdvance() && !saving ? 'pointer' : 'not-allowed',
              opacity: canAdvance() && !saving ? 1 : 0.6,
            }}
          >
            {saving ? 'Saving...' : isLastStep ? 'Save & Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
