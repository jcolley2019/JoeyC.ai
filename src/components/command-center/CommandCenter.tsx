import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAdmin } from '../../hooks/useAdmin'
import { Link } from 'react-router-dom'
import { useContentGeneration } from '../../hooks/useContentGeneration'
import { useSiteSetting } from '../../hooks/useSiteSettings'
import { useLanguage } from '../../hooks/useLanguage'
import { AuthGate } from './AuthGate'
import { InputPanel } from './InputPanel'
import { OutputPanel } from './OutputPanel'
import { GeneratedContentTabs } from './GeneratedContentTabs'
import { ContentHistory } from './ContentHistory'
import { GuidedTour } from './GuidedTour'
import { BlogPostEditor } from './BlogPostEditor'
import { BlogClarifyForm } from './BlogClarifyForm'
import { MediaPromptWizard } from './MediaPromptWizard'
import { SiteSettings } from './SiteSettings'
import { OnboardingWizard } from './OnboardingWizard'
import { BrandSettingsPanel } from './BrandSettingsPanel'
import { useBrandProfile } from '../../hooks/useBrandProfile'
import type { BlogClarifyData } from './BlogClarifyForm'
import type { OutputFormat, Platform } from '../../types'

// AI platform keywords to detect in brain dump text
const VIDEO_PLATFORM_KEYWORDS = ['veo', 'sora', 'kling', 'higgsfield', 'seedance', 'runway', 'pika', 'hailuo']
const IMAGE_PLATFORM_KEYWORDS = ['midjourney', 'dall-e', 'dalle', 'flux', 'ideogram', 'firefly', 'imagen', 'stable diffusion', 'nano banana']

function detectAiPlatform(text: string): { mediaType: 'video' | 'image'; aiPlatform: string } | null {
  const lower = text.toLowerCase()
  for (const kw of VIDEO_PLATFORM_KEYWORDS) {
    if (lower.includes(kw)) return { mediaType: 'video', aiPlatform: kw }
  }
  for (const kw of IMAGE_PLATFORM_KEYWORDS) {
    if (lower.includes(kw)) return { mediaType: 'image', aiPlatform: kw }
  }
  return null
}

function getAspectRatios(platforms: Platform[], instagramFormat?: string): string {
  const ratios: string[] = []
  for (const p of platforms) {
    if (p === 'tiktok') ratios.push('9:16 (1080x1920) for TikTok')
    if (p === 'youtube') ratios.push('16:9 (1920x1080) for YouTube')
    if (p === 'pinterest') ratios.push('2:3 (1000x1500) for Pinterest')
    if (p === 'linkedin') ratios.push('1.91:1 (1200x628) for LinkedIn')
    if (p === 'instagram') {
      if (instagramFormat === 'reel') ratios.push('9:16 (1080x1920) for Instagram Reel/Story')
      else if (instagramFormat === 'square') ratios.push('1:1 (1080x1080) for Instagram Square Post')
      else if (instagramFormat === 'landscape') ratios.push('1.91:1 (1080x566) for Instagram Landscape')
      else ratios.push('Instagram (format TBD)')
    }
  }
  return ratios.length > 0 ? ratios.join('\n') : '9:16 (1080x1920) default'
}

export function CommandCenter() {
  const { session, loading: authLoading, login, signUp, signInWithGoogle, logout } = useAuth()
  const { isMasterAdmin } = useAdmin()
  const { generating, generatingStatus, result, error, usageSummary, generate, extractYouTubeTranscript, setResult, setError } = useContentGeneration()
  const perplexityHashtags = useSiteSetting('perplexity_hashtags_enabled', false)
  const extraPlatform = useSiteSetting('extra_platform_youtube', true)
  const { t } = useLanguage()
  const { profile: brandProfile, loading: brandLoading, saveProfile, uploadLogo, isOnboarded } = useBrandProfile()
  const [showBrandSettings, setShowBrandSettings] = useState(false)

  // Build enabled platforms list — always TikTok/Instagram/Pinterest + YouTube or LinkedIn
  const extraIsYoutube = extraPlatform.value !== false // true or null (loading) = YouTube
  const enabledPlatforms: Platform[] = ['tiktok', 'instagram', 'pinterest', extraIsYoutube ? 'youtube' : 'linkedin']

  // Theme
  const [luxeMode, setLuxeMode] = useState(() => {
    try { return localStorage.getItem('cc-theme') === 'luxe' } catch { return false }
  })
  const toggleLuxeMode = useCallback(() => {
    setLuxeMode(prev => {
      const next = !prev
      try { localStorage.setItem('cc-theme', next ? 'luxe' : 'dark') } catch {}
      return next
    })
  }, [])

  const [inputText, setInputText] = useState('')
  const [inputType, setInputType] = useState<'text' | 'youtube' | 'voice'>('text')
  const [outputFormats, setOutputFormats] = useState<OutputFormat[]>(['social'])
  const [platforms, setPlatforms] = useState<Platform[]>(['tiktok'])

  // When the YT/LI toggle changes, swap any selected platform that's no longer enabled
  useEffect(() => {
    setPlatforms(prev => {
      const swapFrom = extraIsYoutube ? 'linkedin' : 'youtube'
      const swapTo = extraIsYoutube ? 'youtube' : 'linkedin'
      if (prev.includes(swapFrom)) {
        return prev.map(p => p === swapFrom ? swapTo : p)
      }
      return prev
    })
  }, [extraIsYoutube])
  const [cascade, setCascade] = useState(true)
  const [showBlogEditor, setShowBlogEditor] = useState(false)
  const [blogEditorContent, setBlogEditorContent] = useState('')
  const [historyKey, setHistoryKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Blog clarify form
  const [showBlogClarify, setShowBlogClarify] = useState(false)
  const [blogClarifyData, setBlogClarifyData] = useState<BlogClarifyData>({ tools: '', details: '', affiliateLinks: [], mediaRefs: '', mediaAttachments: [] })

  // Media prompt wizard
  const [showMediaWizard, setShowMediaWizard] = useState(false)
  const [pendingMediaData, setPendingMediaData] = useState<{ mediaType: 'video' | 'image'; aiPlatform: string } | null>(null)
  const [instagramFormat, setInstagramFormat] = useState<string | null>(null)
  const [showInstagramPicker, setShowInstagramPicker] = useState(false)

  // Generated content for tabbed view
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

  // Sync result to generated content
  useEffect(() => {
    if (result !== null) {
      setGeneratedContent(result)
    }
  }, [result])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasBlog = outputFormats.includes('blog')

  const handleGenerate = useCallback(() => {
    if (!inputText.trim()) return

    const isVideoFormat = outputFormats.length === 1 && outputFormats[0] === 'video'

    // If Image & Video Prompts is selected, check for AI platform in text
    if (isVideoFormat) {
      const detected = detectAiPlatform(inputText)
      if (!detected) {
        // No platform mentioned — show wizard
        setShowMediaWizard(true)
        return
      }
      // Platform detected — check if Instagram needs format selection
      if (platforms.includes('instagram') && !instagramFormat) {
        setPendingMediaData(detected)
        setShowInstagramPicker(true)
        return
      }
      // All info collected — fire per-platform generation
      fireVideoGeneration(detected, instagramFormat || undefined)
      return
    }

    // If blog is selected and clarify form isn't showing yet, show it first
    if (hasBlog && !showBlogClarify) {
      setShowBlogClarify(true)
      return
    }

    let finalInput = inputText

    // If clarify form is showing, add that context too
    if (showBlogClarify) {
      setShowBlogClarify(false)
      const data = blogClarifyData
      if (data.tools) finalInput += `\n\n---\nTools/gear used: ${data.tools}`
      if (data.details) finalInput += `\nAdditional details: ${data.details}`
      if (data.affiliateLinks.length > 0) {
        finalInput += `\n\nAffiliate links — naturally weave these into the relevant sections of the article:\n${data.affiliateLinks.map(l => `- ${l.name}: ${l.url}`).join('\n')}`
      }
      if (data.mediaRefs) finalInput += `\nMedia references to include: ${data.mediaRefs}`
      if (data.mediaAttachments.length > 0) {
        const mediaNames = data.mediaAttachments.map(a => `[${a.type.toUpperCase()}: ${a.name}]`).join(', ')
        finalInput += `\nAttached media: ${mediaNames}`
      }
    }

    generate({
      input_type: inputType,
      input_text: finalInput,
      output_formats: outputFormats,
      platforms,
      cascade,
      usePerplexity: !!perplexityHashtags.value,
      brand_context: brandProfile ?? undefined,
    }).then(() => {
      setHistoryKey(k => k + 1)
    })
  }, [inputText, inputType, outputFormats, platforms, cascade, generate, showBlogClarify, hasBlog, blogClarifyData, perplexityHashtags.value, brandProfile])

  // Fires one video generation call per selected platform for tabbed output
  const fireVideoGeneration = useCallback((mediaData: { mediaType: 'video' | 'image'; aiPlatform: string }, igFormat?: string) => {
    const perPlatformSections = platforms.map(p => {
      const ratio = p === 'tiktok' ? '9:16 (1080x1920)'
        : p === 'youtube' ? '16:9 (1920x1080)'
        : p === 'pinterest' ? '2:3 (1000x1500)'
        : p === 'linkedin' ? '1.91:1 (1200x628)'
        : p === 'instagram' ? (
          igFormat === 'reel' ? '9:16 (1080x1920)' :
          igFormat === 'square' ? '1:1 (1080x1080)' :
          igFormat === 'landscape' ? '1.91:1 (1080x566)' : '9:16 (1080x1920)'
        ) : '9:16 (1080x1920)'
      return `Generate a ${mediaData.mediaType} prompt for ${p.toUpperCase()}.\nAspect Ratio: ${ratio}`
    })

    const enhancedInput = `${inputText}\n\n---\nMedia type: ${mediaData.mediaType}\nAI Platform: ${mediaData.aiPlatform}\nTarget Platforms: ${platforms.join(', ')}\n\nGenerate ONE separate prompt section for EACH platform below. Label each section clearly with the platform name as a header.\n\n${perPlatformSections.join('\n\n')}`

    generate({
      input_type: inputType,
      input_text: enhancedInput,
      output_formats: ['video'],
      platforms,
      cascade: false,
      usePerplexity: false,
    }).then(() => {
      setHistoryKey(k => k + 1)
      setInstagramFormat(null)
      setPendingMediaData(null)
    })
  }, [inputText, inputType, platforms, generate])

  const handleMediaWizardComplete = useCallback((data: { mediaType: 'video' | 'image'; aiPlatform: string; instagramFormat?: string }) => {
    setShowMediaWizard(false)
    if (data.instagramFormat) {
      setInstagramFormat(data.instagramFormat)
      fireVideoGeneration(data, data.instagramFormat)
    } else if (platforms.includes('instagram')) {
      // Wizard didn't include Instagram step (not in platforms at wizard time) but now it is
      setPendingMediaData(data)
      setShowInstagramPicker(true)
    } else {
      fireVideoGeneration(data)
    }
  }, [platforms, fireVideoGeneration])

  const handleInstagramFormatSelect = useCallback((format: string) => {
    setShowInstagramPicker(false)
    setInstagramFormat(format)
    if (pendingMediaData) {
      fireVideoGeneration(pendingMediaData, format)
    } else {
      // Detected from text path
      const detected = detectAiPlatform(inputText)
      if (detected) fireVideoGeneration(detected, format)
    }
  }, [pendingMediaData, inputText, fireVideoGeneration])

  const handleBlogClarifyDataChange = useCallback((data: BlogClarifyData) => {
    setBlogClarifyData(data)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <AuthGate onLogin={login} onSignUp={signUp} onGoogleSignIn={signInWithGoogle} isAuthenticated={!!session}>
      <div className={`min-h-screen command-center-bright ${luxeMode ? 'luxe-mode' : ''}`}>
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-mono text-[13px] tracking-[0.25em] uppercase text-primary font-semibold">
                {t('cc.header')}
              </p>
              <h1 className="text-2xl font-bold mt-1 tracking-tight">{t('cc.title')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLuxeMode}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                  luxeMode
                    ? 'bg-gradient-to-r from-[#b8860b] to-[#d4a017] text-white border-transparent font-semibold'
                    : 'border-border text-text-secondary hover:text-primary hover:border-primary/30'
                }`}
                title={luxeMode ? 'Switch to Dark Mode' : 'Switch to Luxe Mode'}
              >
                {luxeMode ? '🌙 Dark' : '✨ Luxe'}
              </button>
              <button
                onClick={() => setTourActive(true)}
                className="p-2 rounded-md border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                title={t('tour.input.title')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              {isMasterAdmin && (
                <div id="tour-settings" ref={settingsRef} className="relative">
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`p-2 rounded-md border transition-all ${
                      settingsOpen
                        ? 'border-primary/50 text-primary bg-primary/10'
                        : 'border-border text-text-secondary hover:text-primary hover:border-primary/30'
                    }`}
                    title="Site Controls"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  </button>
                  {settingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl border border-border bg-bg-card shadow-xl shadow-black/30">
                      <div className="p-4">
                        <SiteSettings extraPlatform={extraPlatform} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => { setSettingsOpen(false); setShowBrandSettings(true) }}
                className="p-2 rounded-md border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                title="Brand Profile"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              {isMasterAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 text-xs font-mono border border-border rounded-md text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-mono border border-border rounded-md text-text-secondary hover:text-red-400 hover:border-red-400/30 transition-colors"
              >
                {t('cc.logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Top: Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left: Input */}
            <div id="tour-input" className="flex flex-col gap-6">
              <div className="shrink-0">
                <h2 className="text-[14px] font-bold text-white uppercase tracking-[0.12em] mb-1">{t('cc.input')}</h2>
                <p className="text-[14px] text-[#94a3b8]">{t('cc.input.desc')}</p>
              </div>
              <InputPanel
                inputText={inputText}
                onInputTextChange={setInputText}
                onInputTypeChange={setInputType}
                extractTranscript={extractYouTubeTranscript}
              />
            </div>

            {/* Right: Format selectors + Media + Affiliate + Generate */}
            <div id="tour-output" className="flex flex-col gap-6">
              <div>
                <h2 className="text-[14px] font-bold text-white uppercase tracking-[0.12em] mb-1">{t('cc.output')}</h2>
                <p className="text-[14px] text-[#94a3b8]">{t('cc.output.desc')}</p>
              </div>
              <div className="flex-1 flex flex-col">
                <OutputPanel
                  formats={outputFormats}
                  onFormatsChange={setOutputFormats}
                  platforms={platforms}
                  onPlatformsChange={setPlatforms}
                  cascade={cascade}
                  onCascadeChange={setCascade}
                  generating={generating}
                  onGenerate={handleGenerate}
                  inputReady={inputText.trim().length > 0}
                  enabledPlatforms={enabledPlatforms}
                />
              </div>
            </div>
          </div>

          {/* Full-width: Quick Context + Status */}
          {(showBlogClarify || generating || error || usageSummary) && (
            <div className="mt-8 pt-8 border-t border-border space-y-6">
              {showBlogClarify && (
                <BlogClarifyForm
                  onDataChange={handleBlogClarifyDataChange}
                  onSkip={() => {
                    setShowBlogClarify(false)
                    generate({
                      input_type: inputType,
                      input_text: inputText,
                      output_formats: outputFormats,
                      platforms,
                      cascade,
                      usePerplexity: !!perplexityHashtags.value,
                      brand_context: brandProfile ?? undefined,
                    }).then(() => setHistoryKey(k => k + 1))
                  }}
                />
              )}
              {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
              {usageSummary && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-bg-card/30 text-[13px] font-mono text-[#94a3b8]">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <span title="Estimated API cost">{usageSummary.estimatedCost}</span>
                    <span className="hidden md:inline text-border">|</span>
                    <span className="md:hidden text-border/50">•</span>
                    <span title="Tokens used">{(usageSummary.totalInputTokens + usageSummary.totalOutputTokens).toLocaleString()} tokens</span>
                    <span className="hidden md:inline text-border">|</span>
                    <span className="md:hidden text-border/50">•</span>
                    <span title="Daily usage">{usageSummary.dailyUsed}/{usageSummary.dailyLimit} today</span>
                    {usageSummary.webSearchUsed && (
                      <span className="hidden md:inline text-border">|</span>
                    )}
                    {usageSummary.webSearchUsed && (
                      <span className="hidden md:inline text-[#4a9eff]" title="Web search was used for research">web search</span>
                    )}
                    {usageSummary.models.length > 1 && (
                      <span className="hidden md:inline text-border">|</span>
                    )}
                    {usageSummary.models.length > 1 && (
                      <span className="hidden md:inline" title="Multiple models used (cascade)">multi-model</span>
                    )}
                  </div>
                  {(usageSummary.webSearchUsed || usageSummary.models.length > 1) && (
                    <div className="flex items-center gap-2 md:hidden">
                      {usageSummary.webSearchUsed && (
                        <span className="text-[11px] text-[#4a9eff] bg-[rgba(74,111,165,0.15)] border border-[rgba(74,111,165,0.3)] rounded px-2 py-0.5">web search</span>
                      )}
                      {usageSummary.models.length > 1 && (
                        <span className="text-[11px] text-[#4a9eff] bg-[rgba(74,111,165,0.15)] border border-[rgba(74,111,165,0.3)] rounded px-2 py-0.5">multi-model</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Brand badge — shown when blog format selected */}
          {hasBlog && brandProfile && isOnboarded && (
            <div className="mt-8 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/50 bg-bg-card/30">
              {brandProfile.logo_url && (
                <img src={brandProfile.logo_url} alt="" className="w-8 h-8 rounded-md object-contain" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white">{brandProfile.display_name}</span>
                {brandProfile.title && <span className="text-[12px] text-[#8892a4] ml-2">{brandProfile.title}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8892a4] capitalize">{brandProfile.style_preset}</span>
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: brandProfile.accent_color }} />
                <button onClick={() => setShowBrandSettings(true)} className="text-[11px] font-mono text-[#4a6fa5] hover:text-white transition-colors">Edit</button>
              </div>
            </div>
          )}
          {hasBlog && (!brandProfile || !isOnboarded) && (
            <button
              onClick={() => setShowBrandSettings(true)}
              className="mt-8 w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border/50 text-[#8892a4] hover:text-primary hover:border-primary/30 transition-colors text-left"
            >
              <span className="text-sm">✍️ Add your brand to personalize this blog →</span>
            </button>
          )}

          {/* Drafts / Prompts output */}
          <div id="tour-drafts" className="mt-12 pt-8 border-t border-border">
            {outputFormats.length === 1 && outputFormats[0] === 'video' ? (
              <>
                <h2 className="text-[20px] font-bold text-white mb-1">Image & Video Prompts</h2>
                <p className="text-[14px] text-[#94a3b8] mb-4">
                  {generatedContent
                    ? 'Your platform-optimized prompts are below. Copy and paste into your AI platform.'
                    : 'Generated prompts will appear here, optimized for your chosen AI platform.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-bold text-white mb-1">{t('cc.drafts')}</h2>
                <p className="text-[14px] text-[#94a3b8] mb-4">
                  {generatedContent
                    ? t('cc.drafts.ready')
                    : t('cc.drafts.empty.desc')}
                </p>
              </>
            )}
            {generatedContent ? (
              <GeneratedContentTabs
                rawContent={generatedContent}
                onContentChange={setGeneratedContent}
                onClear={() => setGeneratedContent(null)}
                onPublishBlog={(content) => {
                  setBlogEditorContent(content)
                  setShowBlogEditor(true)
                }}
                brandProfile={brandProfile}
              />
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-text-secondary text-sm">{t('cc.drafts.none')}</p>
              </div>
            )}
          </div>

          {/* History */}
          <div id="tour-history" className="mt-12 pt-8 border-t border-border">
            <h2 className="text-[16px] font-bold text-white uppercase tracking-[0.1em] mb-1">{t('cc.history')}</h2>
            <p className="text-[14px] text-[#94a3b8] mb-4">{t('cc.history.desc')}</p>
            <ContentHistory key={historyKey} />
          </div>
        </div>

        {/* Blog Editor Modal */}
        {showBlogEditor && blogEditorContent && (
          <BlogPostEditor
            initialContent={blogEditorContent}
            onClose={() => setShowBlogEditor(false)}
            onPublished={() => {
              setShowBlogEditor(false)
              setBlogEditorContent('')
            }}
          />
        )}

        {/* Instagram Format Picker */}
        {showInstagramPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstagramPicker(false)} />
            <div className="relative w-full max-w-[400px] mx-4 rounded-xl border border-[#4a6fa5]/60 bg-[#0a0a1a] shadow-2xl p-6">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#4a6fa5] mb-1">// instagram format</p>
              <h2 className="text-lg font-semibold text-white mb-1">Instagram Format</h2>
              <p className="text-[13px] text-[#8892a4] mb-5">What type of Instagram content is this for?</p>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'reel', label: 'Reel / Story', ratio: '9:16 (1080x1920)' },
                  { id: 'square', label: 'Square Post', ratio: '1:1 (1080x1080)' },
                  { id: 'landscape', label: 'Landscape Post', ratio: '1.91:1 (1080x566)' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleInstagramFormatSelect(f.id)}
                    className="flex items-center justify-between px-5 py-4 rounded-lg border border-[#1e2a4a] bg-[#0c1020] hover:border-[#4a6fa5] text-left transition-all"
                  >
                    <span className="text-[14px] font-medium text-[#a0aac0]">{f.label}</span>
                    <span className="text-[12px] font-mono text-[#8892a4]">{f.ratio}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowInstagramPicker(false)} className="mt-4 text-sm font-mono text-[#8892a4] hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Media Prompt Wizard */}
        <MediaPromptWizard
          open={showMediaWizard}
          platforms={platforms}
          onComplete={handleMediaWizardComplete}
          onClose={() => setShowMediaWizard(false)}
        />

        {/* Guided Tour */}
        <GuidedTour active={tourActive} onClose={() => setTourActive(false)} />

        {/* Brand Settings Panel */}
        <BrandSettingsPanel
          open={showBrandSettings}
          onClose={() => setShowBrandSettings(false)}
          profile={brandProfile}
          onSave={saveProfile}
          onUploadLogo={uploadLogo}
        />
      </div>

      {/* Onboarding Wizard — rendered OUTSIDE luxe-mode div to avoid theme inheritance */}
      {!brandLoading && !isOnboarded && (
        <OnboardingWizard
          open={true}
          onThemeChange={(theme) => setLuxeMode(theme === 'luxe')}
          onComplete={async (data) => {
            let logoUrl: string | null = null
            if (data.logoFile) {
              logoUrl = await uploadLogo(data.logoFile)
            }
            await saveProfile({
              display_name: data.display_name || null,
              title: data.title || null,
              bio: data.bio || null,
              website_url: data.website_url || null,
              tiktok_handle: data.tiktok_handle || null,
              instagram_handle: data.instagram_handle || null,
              pinterest_handle: data.pinterest_handle || null,
              youtube_handle: data.youtube_handle || null,
              linkedin_handle: data.linkedin_handle || null,
              style_preset: data.style_preset,
              accent_color: data.accent_color,
              has_branding_kit: data.has_branding_kit,
              brand_kit_notes: data.brand_kit_notes || null,
              ...(logoUrl ? { logo_url: logoUrl } : {}),
              onboarding_completed: true,
            })
          }}
          onSkip={async () => {
            await saveProfile({ onboarding_completed: true })
          }}
        />
      )}
    </AuthGate>
  )
}
