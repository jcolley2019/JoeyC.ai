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
import { SiteSettings } from './SiteSettings'
import type { BlogClarifyData } from './BlogClarifyForm'
import type { OutputFormat, Platform } from '../../types'

export function CommandCenter() {
  const { session, loading: authLoading, login, signUp, signInWithGoogle, logout } = useAuth()
  const { isMasterAdmin } = useAdmin()
  const { generating, generatingStatus, result, error, usageSummary, generate, extractYouTubeTranscript, setResult, setError } = useContentGeneration()
  const perplexityHashtags = useSiteSetting('perplexity_hashtags_enabled', false)
  const extraPlatform = useSiteSetting('extra_platform_youtube', true)
  const { t } = useLanguage()

  // Build enabled platforms list — always TikTok/Instagram/Pinterest + YouTube or LinkedIn
  const extraIsYoutube = extraPlatform.value !== false // true or null (loading) = YouTube
  const enabledPlatforms: Platform[] = ['tiktok', 'instagram', 'pinterest', extraIsYoutube ? 'youtube' : 'linkedin']

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
    }).then(() => {
      setHistoryKey(k => k + 1)
    })
  }, [inputText, inputType, outputFormats, platforms, cascade, generate, showBlogClarify, hasBlog, blogClarifyData, perplexityHashtags.value])

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
      <div className="min-h-screen command-center-bright">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary">
                {t('cc.header')}
              </p>
              <h1 className="text-xl font-bold mt-1">{t('cc.title')}</h1>
            </div>
            <div className="flex items-center gap-4">
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
                <h2 className="font-semibold text-text-primary mb-1">{t('cc.input')}</h2>
                <p className="text-xs text-text-secondary">{t('cc.input.desc')}</p>
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
                <h2 className="font-semibold text-text-primary mb-1">{t('cc.output')}</h2>
                <p className="text-xs text-text-secondary">{t('cc.output.desc')}</p>
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
                <BlogClarifyForm onDataChange={handleBlogClarifyDataChange} />
              )}
              {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
              {generating && (
                <div className="flex items-center justify-center gap-3 py-12 text-text-secondary">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm font-mono">{generatingStatus || t('cc.generating')}</span>
                </div>
              )}
              {usageSummary && (
                <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border border-border/50 bg-bg-card/30 text-xs font-mono text-text-secondary">
                  <span title="Estimated API cost">{usageSummary.estimatedCost}</span>
                  <span className="text-border">|</span>
                  <span title="Tokens used">{(usageSummary.totalInputTokens + usageSummary.totalOutputTokens).toLocaleString()} tokens</span>
                  <span className="text-border">|</span>
                  <span title="Daily usage">{usageSummary.dailyUsed}/{usageSummary.dailyLimit} today</span>
                  {usageSummary.webSearchUsed && (
                    <>
                      <span className="text-border">|</span>
                      <span className="text-primary" title="Web search was used for research">web search</span>
                    </>
                  )}
                  {usageSummary.models.length > 1 && (
                    <>
                      <span className="text-border">|</span>
                      <span title="Multiple models used (cascade)">multi-model</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Blog / Social Media Drafts */}
          <div id="tour-drafts" className="mt-12 pt-8 border-t border-border">
            <h2 className="font-semibold text-text-primary mb-1">{t('cc.drafts')}</h2>
            <p className="text-xs text-text-secondary mb-4">
              {generatedContent
                ? t('cc.drafts.ready')
                : t('cc.drafts.empty.desc')
              }
            </p>
            {generatedContent ? (
              <GeneratedContentTabs
                rawContent={generatedContent}
                onContentChange={setGeneratedContent}
                onPublishBlog={(content) => {
                  setBlogEditorContent(content)
                  setShowBlogEditor(true)
                }}
              />
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-text-secondary text-sm">{t('cc.drafts.none')}</p>
              </div>
            )}
          </div>

          {/* History */}
          <div id="tour-history" className="mt-12 pt-8 border-t border-border">
            <h2 className="font-semibold text-text-primary mb-1">{t('cc.history')}</h2>
            <p className="text-xs text-text-secondary mb-4">{t('cc.history.desc')}</p>
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

        {/* Guided Tour */}
        <GuidedTour active={tourActive} onClose={() => setTourActive(false)} />
      </div>
    </AuthGate>
  )
}
