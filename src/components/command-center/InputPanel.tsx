import { useState, useRef, useEffect, useCallback } from 'react'
import { YouTubeInput } from './YouTubeInput'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { useLanguage } from '../../hooks/useLanguage'
import { supabase } from '../../lib/supabase'

type InputTab = 'braindump' | 'youtube'

interface InputPanelProps {
  inputText: string
  onInputTextChange: (text: string) => void
  onInputTypeChange: (type: 'text' | 'youtube' | 'voice') => void
  extractTranscript: (url: string) => Promise<string | null>
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function InputPanel({ inputText, onInputTextChange, onInputTypeChange, extractTranscript }: InputPanelProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<InputTab>('braindump')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    isRecording,
    isPaused,
    interimText,
    error: voiceError,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useVoiceRecorder({
    onFinalTranscript: (text: string) => {
      // Append spoken text to the existing input
      onInputTextChange(inputText ? inputText + ' ' + text : text)
    },
  })

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRecording, isPaused])

  const handleStart = useCallback(() => {
    setRecordingTime(0)
    onInputTypeChange('voice')
    startRecording()
  }, [startRecording, onInputTypeChange])

  const handleStop = useCallback(() => {
    stopRecording()
    setRecordingTime(0)
  }, [stopRecording])

  const handleNewParagraph = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      onInputTextChange(inputText + '\n\n')
      return
    }
    const pos = textarea.selectionStart
    const before = inputText.slice(0, pos)
    const after = inputText.slice(pos)
    const newText = before + '\n\n' + after
    onInputTextChange(newText)
    // Set cursor after the break
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = pos + 2
      textarea.focus()
    })
  }, [inputText, onInputTextChange])

  const handleTabChange = (tab: InputTab) => {
    setActiveTab(tab)
    if (tab === 'braindump') {
      onInputTypeChange('text')
    }
  }

  const [spanishMode, setSpanishMode] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [originalText, setOriginalText] = useState<string | null>(null)

  const handleSpanishToggle = useCallback(async () => {
    if (spanishMode) {
      // Switch back to English — restore original
      if (originalText !== null) {
        onInputTextChange(originalText)
        setOriginalText(null)
      }
      setSpanishMode(false)
    } else {
      // Translate to Spanish
      if (!inputText.trim()) return
      setTranslating(true)
      setOriginalText(inputText)
      try {
        const { data, error: fnError } = await supabase.functions.invoke('translate', {
          body: { text: inputText, target_language: 'Spanish' },
        })
        if (fnError) throw fnError
        if (data?.translated) {
          onInputTextChange(data.translated)
          setSpanishMode(true)
        }
      } catch (err) {
        console.error('Translation failed:', err)
        setOriginalText(null)
      } finally {
        setTranslating(false)
      }
    }
  }, [spanishMode, inputText, originalText, onInputTextChange])

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Tabs — just Brain Dump and YouTube now */}
      <div className="flex gap-1 bg-bg border border-border rounded-lg p-1">
        <button
          onClick={() => handleTabChange('braindump')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'braindump'
              ? 'border-primary bg-primary/10 text-white'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          {t('input.braindump')}
        </button>
        <button
          onClick={() => handleTabChange('youtube')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'youtube'
              ? 'border-primary bg-primary/10 text-white'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          {t('input.youtube')}
        </button>
      </div>

      {activeTab === 'braindump' && (
        <div className="flex flex-col gap-3 flex-1">
          {/* Voice controls bar */}
          {isSupported && (
            <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
              isRecording
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-border bg-bg-card'
            }`}>
              {/* Record / Pause / Resume button */}
              {!isRecording ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-mono hover:bg-primary/20 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  {t('input.record')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                      isPaused
                        ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
                        : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        {t('input.resume')}
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        {t('input.pause')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    {t('input.stop')}
                  </button>
                </div>
              )}

              {/* Waveform / status */}
              <div className="flex-1 flex items-center gap-3">
                {isRecording && !isPaused && (
                  <div className="flex items-center gap-[3px] h-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-red-400 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 10}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: `${0.4 + Math.random() * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {isRecording && isPaused && (
                  <span className="text-xs font-mono text-yellow-400">{t('input.paused')}</span>
                )}
                {!isRecording && (
                  <span className="text-xs text-text-secondary">{t('input.voice.hint')}</span>
                )}
              </div>

              {/* Timer */}
              {isRecording && (
                <span className="font-mono text-xs text-text-secondary tabular-nums">
                  {formatTime(recordingTime)}
                </span>
              )}

              {/* Recording dot */}
              {isRecording && !isPaused && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
          )}

          {voiceError && (
            <p className="text-red-400 text-xs font-mono">{voiceError}</p>
          )}

          {/* Unified textarea */}
          <div className="relative flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={inputText + (interimText ? (inputText ? ' ' : '') + interimText : '')}
              onChange={e => {
                const newVal = e.target.value
                if (interimText) {
                  const suffix = (inputText ? ' ' : '') + interimText
                  if (newVal.endsWith(suffix)) {
                    onInputTextChange(newVal.slice(0, -suffix.length))
                  }
                } else {
                  onInputTextChange(newVal)
                }
              }}
              placeholder={isRecording ? t('input.placeholder.recording') : t('input.placeholder')}
              className={`w-full flex-1 min-h-[200px] bg-bg-card border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors resize-none text-sm leading-relaxed ${
                isRecording && !isPaused
                  ? 'border-red-500/30 focus:border-red-500/50'
                  : 'border-border focus:border-primary'
              }`}
            />
            {/* Interim text indicator */}
            {interimText && (
              <div className="absolute bottom-3 left-4 right-4">
                <div className="h-[2px] bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded animate-pulse" />
              </div>
            )}
          </div>

          {/* Stats + controls — all on one line */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[13px] font-mono text-[#94a3b8] px-1">
              <span>{inputText.length} {t('input.chars')}</span>
              <span className="text-border">·</span>
              <span>{wordCount} {t('input.words')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpanishToggle}
                disabled={translating || (!spanishMode && !inputText.trim())}
                className={`flex items-center rounded-md text-xs font-mono border overflow-hidden transition-all ${
                  translating || (!spanishMode && !inputText.trim())
                    ? 'opacity-40 cursor-not-allowed border-border'
                    : 'border-primary/30 hover:border-primary/50'
                }`}
              >
                {translating ? (
                  <span className="px-3 py-1.5 text-text-secondary flex items-center gap-1.5">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    {t('input.translating')}
                  </span>
                ) : (
                  <>
                    <span className={`px-3 py-1.5 transition-all ${
                      !spanishMode
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}>
                      EN
                    </span>
                    <span className={`px-3 py-1.5 transition-all ${
                      spanishMode
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}>
                      ES
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={handleNewParagraph}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-all"
                title="Insert new paragraph at cursor"
              >
                {t('input.newpara')}
              </button>
              {inputText.trim() && (
                <button
                  onClick={() => onInputTextChange('')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all"
                >
                  {t('input.clear')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'youtube' && (
        <YouTubeInput
          onTranscriptExtracted={onInputTextChange}
          extractTranscript={extractTranscript}
        />
      )}
    </div>
  )
}
