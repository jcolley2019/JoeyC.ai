import { useState } from 'react'
import type { OutputFormat } from '../../types'
import { useLanguage } from '../../hooks/useLanguage'

interface FormatSelectorProps {
  value: OutputFormat[]
  onChange: (formats: OutputFormat[]) => void
  xConnected?: boolean
  isMasterAdmin?: boolean
  onXConnect?: () => void
  onXDisconnect?: () => void
  xConnecting?: boolean
}

const contentFormats: { value: OutputFormat; labelKey: string; descKey: string }[] = [
  { value: 'social', labelKey: 'format.social', descKey: 'format.social.desc' },
  { value: 'blog', labelKey: 'format.blog', descKey: 'format.blog.desc' },
  { value: 'thread', labelKey: 'format.thread', descKey: 'format.thread.desc' },
]

export function FormatSelector({ value, onChange, xConnected, isMasterAdmin, onXConnect, onXDisconnect, xConnecting }: FormatSelectorProps) {
  const { t } = useLanguage()
  const mediaMode = value.length === 1 && value[0] === 'video'
  const xIsReady = isMasterAdmin || xConnected
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const toggleMode = () => {
    if (mediaMode) {
      onChange(['social'])
    } else {
      onChange(['video'])
    }
  }

  const toggleFormat = (format: OutputFormat) => {
    if (value.includes(format)) {
      if (value.length > 1) {
        onChange(value.filter(f => f !== format))
      }
    } else {
      onChange([...value, format])
    }
  }

  const btnBase = 'px-3 py-2 rounded-lg border text-sm transition-all text-left'
  const btnSelected = 'border-primary bg-primary/10 text-white'
  const btnUnselected = 'border-border bg-bg-card text-text-secondary hover:border-border-hover'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-mono text-white font-bold uppercase tracking-[0.12em]">{t('format.label')}</span>
        <button
          onClick={toggleMode}
          className={`px-2.5 py-1 rounded text-[13px] font-mono font-semibold transition-all ${
            mediaMode
              ? 'bg-[#4a6fa5] text-white border border-[#4a6fa5]'
              : 'text-white border border-[#4a6fa5] hover:bg-[#4a6fa5]/15'
          }`}
        >
          {mediaMode ? '◀ Content Creation' : 'Image & Video Prompts'}
        </button>
      </div>

      {mediaMode ? (
        <div className="transition-opacity duration-200">
          <button
            className="w-full px-4 py-3 rounded-lg border border-primary bg-primary/10 text-white text-sm text-left"
          >
            <span className="font-medium block">{t('format.video')}</span>
            <span className="text-xs opacity-70">{t('format.video.desc')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 transition-opacity duration-200">
          {/* Social Post & Blog buttons — unchanged */}
          {contentFormats.filter(f => f.value !== 'thread').map(f => (
            <button
              key={f.value}
              onClick={() => toggleFormat(f.value)}
              className={`${btnBase} ${value.includes(f.value) ? btnSelected : btnUnselected}`}
            >
              <span className="font-medium block">{t(f.labelKey)}</span>
              <span className="text-xs opacity-70">{t(f.descKey)}</span>
            </button>
          ))}

          {/* X Thread button — with status dot */}
          <button
            onClick={() => toggleFormat('thread')}
            className={`relative ${btnBase} ${value.includes('thread') ? btnSelected : btnUnselected}`}
          >
            <span className="font-medium block">{t('format.thread')}</span>
            <span className="text-xs opacity-70">{t('format.thread.desc')}</span>
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                xIsReady ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={xIsReady ? 'X connected' : 'X not connected'}
            />
          </button>

          {/* X Connect/Disconnect button — 4th grid cell, matches other button styling */}
          {!confirmDisconnect ? (
            <button
              onClick={() => {
                if (xIsReady) {
                  setConfirmDisconnect(true)
                } else {
                  onXConnect?.()
                }
              }}
              disabled={xConnecting}
              className={`${btnBase} ${btnUnselected} disabled:opacity-50`}
            >
              <span className="font-medium flex items-center gap-1">
                <span className="text-text-secondary">&#171;</span>
                {xConnecting ? 'Connecting...' : xIsReady ? 'Disconnect X' : 'Connect X'}
              </span>
              <span className="text-xs opacity-70">{xIsReady ? 'Remove X account' : 'Link your X account'}</span>
            </button>
          ) : (
            <div className={`flex flex-col items-center justify-center gap-1.5 ${btnBase} border-border bg-bg-card`}>
              <span className="font-medium text-text-secondary">Disconnect X?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { onXDisconnect?.(); setConfirmDisconnect(false) }}
                  className="px-3 py-1 text-xs font-mono border border-border rounded hover:border-primary hover:text-primary transition-colors text-text-secondary"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="px-3 py-1 text-xs font-mono border border-border rounded hover:border-primary hover:text-primary transition-colors text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
