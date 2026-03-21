import { useState, useEffect, useCallback } from 'react'

interface MediaPromptWizardProps {
  open: boolean
  platforms: string[]
  onComplete: (data: { mediaType: 'video' | 'image'; aiPlatform: string; instagramFormat?: string }) => void
  onClose: () => void
}

const videoPlatforms = [
  { id: 'veo3', label: 'Veo 3', sub: 'Google' },
  { id: 'sora2', label: 'Sora 2', sub: 'OpenAI' },
  { id: 'kling', label: 'Kling AI', sub: '' },
  { id: 'higgsfield', label: 'Higgsfield', sub: '' },
  { id: 'seedance', label: 'Seedance', sub: '' },
  { id: 'runway', label: 'Runway', sub: '' },
  { id: 'pika', label: 'Pika', sub: '' },
  { id: 'hailuo', label: 'Hailuo', sub: '' },
  { id: 'other', label: 'Other', sub: 'Custom platform' },
]

const imagePlatforms = [
  { id: 'midjourney', label: 'Midjourney', sub: '' },
  { id: 'dalle3', label: 'DALL-E 3', sub: 'ChatGPT' },
  { id: 'flux', label: 'Flux', sub: 'Black Forest Labs' },
  { id: 'ideogram', label: 'Ideogram', sub: '' },
  { id: 'firefly', label: 'Firefly', sub: 'Adobe' },
  { id: 'stable-diffusion', label: 'Stable Diffusion', sub: '' },
  { id: 'nano-banana', label: 'Nano Banana', sub: '' },
  { id: 'other', label: 'Other', sub: 'Custom platform' },
]

const instagramFormats = [
  { id: 'reel', label: 'Reel / Story', ratio: '9:16', resolution: '1080x1920' },
  { id: 'square', label: 'Square Post', ratio: '1:1', resolution: '1080x1080' },
  { id: 'landscape', label: 'Landscape Post', ratio: '1.91:1', resolution: '1080x566' },
]

export function MediaPromptWizard({ open, platforms, onComplete, onClose }: MediaPromptWizardProps) {
  const [step, setStep] = useState(0)
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null)
  const [aiPlatform, setAiPlatform] = useState<string | null>(null)
  const [otherPlatform, setOtherPlatform] = useState('')
  const [instagramFormat, setInstagramFormat] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const needsInstagramStep = platforms.includes('instagram')
  const totalSteps = needsInstagramStep ? 3 : 2

  // Animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setStep(0)
      setMediaType(null)
      setAiPlatform(null)
      setOtherPlatform('')
      setInstagramFormat(null)
    }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const canAdvance = useCallback(() => {
    if (step === 0) return mediaType !== null
    if (step === 1) return aiPlatform !== null && (aiPlatform !== 'other' || otherPlatform.trim() !== '')
    if (step === 2) return instagramFormat !== null
    return false
  }, [step, mediaType, aiPlatform, otherPlatform, instagramFormat])

  const handleNext = () => {
    if (!canAdvance()) return
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      // Complete
      const resolvedPlatform = aiPlatform === 'other' ? otherPlatform.trim() : aiPlatform!
      onComplete({
        mediaType: mediaType!,
        aiPlatform: resolvedPlatform,
        instagramFormat: instagramFormat || undefined,
      })
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
    else onClose()
  }

  if (!open) return null

  const isLastStep = step === totalSteps - 1
  const platformList = mediaType === 'video' ? videoPlatforms : imagePlatforms

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-[500px] mx-4 rounded-xl border border-[#4a6fa5]/60 bg-[#0a0a1a] shadow-2xl shadow-black/50 transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8892a4] hover:text-white transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#4a6fa5]">
            // image & video prompts
          </p>
        </div>

        {/* Content area with fixed height for smooth transitions */}
        <div className="px-6 py-4 min-h-[320px] flex flex-col">

          {/* SCREEN 1 — Media type */}
          {step === 0 && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-6">What are you creating?</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['video', 'image'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setMediaType(type)
                      setAiPlatform(null)
                      setOtherPlatform('')
                    }}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all duration-200 ${
                      mediaType === type
                        ? 'border-[#4a6fa5] bg-[#4a6fa5]/15 shadow-lg shadow-[#4a6fa5]/10'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40 hover:bg-[#0c1020]/80'
                    }`}
                  >
                    <span className="text-4xl">{type === 'video' ? '🎬' : '🖼️'}</span>
                    <span className={`text-base font-semibold ${
                      mediaType === type ? 'text-white' : 'text-[#8892a4]'
                    }`}>
                      {type === 'video' ? 'Video' : 'Image'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 2 — AI Platform */}
          {step === 1 && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Choose your {mediaType === 'video' ? 'video' : 'image'} platform
              </h2>
              <p className="text-[13px] text-[#8892a4] mb-4">
                The prompt will be optimized for this specific AI tool.
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {platformList.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAiPlatform(p.id)}
                    className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border transition-all duration-150 text-center ${
                      aiPlatform === p.id
                        ? 'border-[#4a6fa5] bg-[#4a6fa5]/15'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40'
                    }`}
                  >
                    <span className={`text-[13px] font-medium leading-tight ${
                      aiPlatform === p.id ? 'text-white' : 'text-[#a0aac0]'
                    }`}>
                      {p.label}
                    </span>
                    {p.sub && (
                      <span className="text-[10px] text-[#8892a4] leading-tight">{p.sub}</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Other platform text input */}
              {aiPlatform === 'other' && (
                <input
                  type="text"
                  value={otherPlatform}
                  onChange={e => setOtherPlatform(e.target.value)}
                  placeholder="Enter platform name..."
                  autoFocus
                  className="mt-3 w-full bg-[#0c1020] border border-[#1e2a4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#4a6fa5] transition-colors"
                />
              )}
            </div>
          )}

          {/* SCREEN 3 — Instagram format */}
          {step === 2 && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">Instagram format</h2>
              <p className="text-[13px] text-[#8892a4] mb-5">
                Choose the aspect ratio for your Instagram content.
              </p>
              <div className="flex flex-col gap-3">
                {instagramFormats.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setInstagramFormat(f.id)}
                    className={`flex items-center justify-between px-5 py-4 rounded-lg border transition-all duration-150 ${
                      instagramFormat === f.id
                        ? 'border-[#4a6fa5] bg-[#4a6fa5]/15'
                        : 'border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5]/40'
                    }`}
                  >
                    <span className={`text-[14px] font-medium ${
                      instagramFormat === f.id ? 'text-white' : 'text-[#a0aac0]'
                    }`}>
                      {f.label}
                    </span>
                    <span className="text-[12px] font-mono text-[#8892a4]">
                      {f.ratio} ({f.resolution})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-mono text-[#8892a4] hover:text-white transition-colors"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

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
            {isLastStep ? 'Generate' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
