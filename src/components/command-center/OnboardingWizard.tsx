import { useState, useEffect, useCallback, useRef } from 'react'
import { ColorPicker } from './ColorPicker'
import type { StylePreset } from '../../types'

type AssetChoice = 'full-kit' | 'logo-only' | 'none'

interface OnboardingWizardProps {
  open: boolean
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
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

export function OnboardingWizard({ open, onComplete, onSkip }: OnboardingWizardProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

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

  // Determine steps based on asset choice
  const getSteps = useCallback((): string[] => {
    if (!assetChoice) return ['Welcome', 'Assets']
    if (assetChoice === 'full-kit') return ['Welcome', 'Assets', 'Brand Kit', 'Socials', 'Style']
    if (assetChoice === 'logo-only') return ['Welcome', 'Assets', 'Logo', 'Socials', 'Style']
    return ['Welcome', 'Assets', 'Socials', 'Style']
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

  const canAdvance = useCallback(() => {
    if (step === 0) return displayName.trim().length > 0
    if (step === 1) return assetChoice !== null
    // After asset choice, steps vary
    const label = steps[step]
    if (label === 'Brand Kit' || label === 'Logo') return true // optional
    if (label === 'Socials') return true // skippable
    if (label === 'Style') return stylePreset !== null
    return true
  }, [step, displayName, assetChoice, steps, stylePreset])

  const handleNext = () => {
    if (!canAdvance()) return
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      // Complete
      onComplete({
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
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-[560px] mx-4 rounded-xl border border-[#4a6fa5]/60 bg-[#0a0a1a] shadow-2xl shadow-black/50 transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[11px] font-mono text-[#8892a4]">Step {step + 1} of {totalSteps}</span>
          </div>
          <div className="w-full h-1 bg-[#1e2a4a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4a6fa5] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[380px] flex flex-col">

          {/* STEP: Welcome — Name + Title + Bio */}
          {currentLabel === 'Welcome' && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#4a6fa5] mb-2">// brand profile</p>
                <h2 className="text-xl font-semibold text-white mb-1">Welcome to Content Studio</h2>
                <p className="text-[13px] text-[#8892a4]">Set up your brand profile to personalize your generated content.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Joey Colley"
                    autoFocus
                    className="w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={titleField}
                    onChange={e => setTitleField(e.target.value)}
                    placeholder='e.g. "AI Builder", "Travel Creator"'
                    className="w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-1">
                    Bio <span className="text-[#64748b]">({bio.length}/280)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => { if (e.target.value.length <= 280) setBio(e.target.value) }}
                    placeholder="A short bio about you and what you do..."
                    rows={3}
                    className="w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-1">Website</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Assets — Choose branding level */}
          {currentLabel === 'Assets' && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">Do you have brand assets?</h2>
              <p className="text-[13px] text-[#8892a4] mb-5">This helps us tailor your setup experience.</p>
              <div className="flex flex-col gap-3">
                {([
                  { id: 'full-kit' as AssetChoice, label: 'Yes, I have a full brand kit', desc: 'Logo, brand colors, guidelines' },
                  { id: 'logo-only' as AssetChoice, label: 'I have a logo', desc: 'Just a logo, no formal brand guidelines' },
                  { id: 'none' as AssetChoice, label: 'No branding yet', desc: "We'll help you pick a style" },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAssetChoice(opt.id)}
                    className={`flex flex-col items-start px-5 py-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      assetChoice === opt.id
                        ? 'border-[#4a6fa5] bg-[#4a6fa5]/15'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40'
                    }`}
                  >
                    <span className={`text-[14px] font-medium ${assetChoice === opt.id ? 'text-white' : 'text-[#a0aac0]'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[12px] text-[#8892a4] mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Brand Kit — Logo + colors + notes */}
          {currentLabel === 'Brand Kit' && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white mb-1">Upload your brand assets</h2>

              {/* Logo upload */}
              <div>
                <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-2">Logo</label>
                <div
                  onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
                  onDragLeave={e => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[#4a6fa5] bg-[#4a6fa5]/10 text-[#4a6fa5]'
                      : logoPreview
                        ? 'border-[#4a6fa5]/40 bg-[#0c1020]'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/30 text-[#8892a4]'
                  }`}
                >
                  {logoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-md object-contain" />
                      <span className="text-sm text-[#a0aac0]">{logoFile?.name}</span>
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

              {/* Accent colors */}
              <ColorPicker value={accentColor} onChange={setAccentColor} label="Brand Accent Color" />

              {/* Brand kit notes */}
              <div>
                <label className="block text-[12px] font-mono text-[#8892a4] uppercase tracking-wider mb-1">Brand Guidelines / Notes</label>
                <textarea
                  value={brandKitNotes}
                  onChange={e => setBrandKitNotes(e.target.value)}
                  placeholder="Any brand voice guidelines, tone preferences, color codes..."
                  rows={3}
                  className="w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP: Logo — Logo upload only */}
          {currentLabel === 'Logo' && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white mb-1">Upload your logo</h2>
              <p className="text-[13px] text-[#8892a4]">This will appear on your branded blog posts.</p>

              <div
                onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
                onDragLeave={e => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg px-4 py-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#4a6fa5] bg-[#4a6fa5]/10 text-[#4a6fa5]'
                    : logoPreview
                      ? 'border-[#4a6fa5]/40 bg-[#0c1020]'
                      : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/30 text-[#8892a4]'
                }`}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-md object-contain" />
                    <span className="text-sm text-[#a0aac0]">{logoFile?.name}</span>
                    <span className="text-xs text-[#8892a4]">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-sm">Drop your logo here or click to browse</span>
                    <span className="text-xs text-[#64748b]">PNG, JPG, SVG up to 5MB</span>
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
                <h2 className="text-lg font-semibold text-white mb-1">Social handles</h2>
                <p className="text-[13px] text-[#8892a4] mb-4">These will be linked in your author bio. All optional.</p>
              </div>
              {([
                { label: 'TikTok', value: tiktok, set: setTiktok, placeholder: '@yourhandle' },
                { label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@yourhandle' },
                { label: 'Pinterest', value: pinterest, set: setPinterest, placeholder: '@yourhandle' },
                { label: 'YouTube', value: youtube, set: setYoutube, placeholder: '@yourchannel' },
                { label: 'LinkedIn', value: linkedin, set: setLinkedin, placeholder: 'your-profile' },
              ]).map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[12px] font-mono text-[#8892a4] w-20 shrink-0">{s.label}</span>
                  <input
                    type="text"
                    value={s.value}
                    onChange={e => s.set(e.target.value)}
                    placeholder={s.placeholder}
                    className="flex-1 bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* STEP: Style — Preset + accent color */}
          {currentLabel === 'Style' && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Choose your style</h2>
                <p className="text-[13px] text-[#8892a4]">This sets the tone and typography for your blog posts.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {STYLE_PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetChange(p.id)}
                    className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      stylePreset === p.id
                        ? 'border-[#4a6fa5] bg-[#4a6fa5]/15'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40'
                    }`}
                  >
                    <span
                      className="text-[18px] font-semibold text-white mb-1 leading-tight"
                      style={{ fontFamily: p.fontFamily }}
                    >
                      {p.label}
                    </span>
                    <span className="text-[11px] text-[#8892a4] mb-2">{p.font}</span>
                    <span
                      className="text-[13px] text-[#a0aac0] leading-snug"
                      style={{ fontFamily: p.fontFamily }}
                    >
                      The quick brown fox jumps over the lazy dog.
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      <span className="text-[10px] font-mono text-[#8892a4]">{p.feel}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Accent color override */}
              <ColorPicker value={accentColor} onChange={setAccentColor} label="Customize Accent Color" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-mono text-[#8892a4] hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm font-mono text-[#8892a4] hover:text-white transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'bg-[#4a6fa5] w-5'
                    : i < step
                    ? 'bg-[#4a6fa5]/50'
                    : 'bg-[#1e2a4a]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              canAdvance()
                ? 'bg-[#4a6fa5] text-white hover:bg-[#5a82bd] shadow-lg shadow-[#4a6fa5]/20'
                : 'bg-[#1e2a4a] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {isLastStep ? 'Save & Continue' : currentLabel === 'Socials' ? 'Next' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
