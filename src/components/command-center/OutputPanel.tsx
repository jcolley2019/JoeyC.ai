import { useLanguage } from '../../hooks/useLanguage'
import { FormatSelector } from './FormatSelector'
import { PlatformPicker } from './PlatformPicker'
import type { OutputFormat, Platform } from '../../types'

interface OutputPanelProps {
  formats: OutputFormat[]
  onFormatsChange: (formats: OutputFormat[]) => void
  platforms: Platform[]
  onPlatformsChange: (platforms: Platform[]) => void
  cascade: boolean
  onCascadeChange: (cascade: boolean) => void
  generating: boolean
  onGenerate: () => void
  inputReady: boolean
  enabledPlatforms?: Platform[]
  xConnected?: boolean
  isMasterAdmin?: boolean
  onXConnect?: () => void
  onXDisconnect?: () => void
  xConnecting?: boolean
}

export function OutputPanel({
  formats,
  onFormatsChange,
  platforms,
  onPlatformsChange,
  cascade,
  onCascadeChange,
  generating,
  onGenerate,
  inputReady,
  enabledPlatforms,
  xConnected,
  isMasterAdmin,
  onXConnect,
  onXDisconnect,
  xConnecting,
}: OutputPanelProps) {
  const { t } = useLanguage()
  const hasSocial = formats.includes('social')
  const hasVideo = formats.includes('video')
  const hasBlog = formats.includes('blog')
  const hasOtherFormats = formats.some(f => f !== 'blog')
  const showCascadeToggle = hasBlog && hasOtherFormats
  const showPlatforms = hasSocial || hasVideo

  return (
    <div className="flex flex-col gap-4 h-full">
      <FormatSelector
        value={formats}
        onChange={onFormatsChange}
        xConnected={xConnected}
        isMasterAdmin={isMasterAdmin}
        onXConnect={onXConnect}
        onXDisconnect={onXDisconnect}
        xConnecting={xConnecting}
      />

      {showPlatforms && (
        <PlatformPicker
          value={platforms}
          onChange={onPlatformsChange}
          cascade={cascade}
          onCascadeChange={onCascadeChange}
          showCascade={showCascadeToggle}
          enabledPlatforms={enabledPlatforms}
        />
      )}

      {/* Spacer to push Generate button to bottom */}
      <div className="flex-1" />

      {/* Generate button */}
      <button
        id="tour-generate"
        onClick={onGenerate}
        disabled={generating || !inputReady}
        className="w-full generate-btn font-semibold py-3 rounded-lg relative z-10 disabled:opacity-70 transition-all text-white text-[15px] tracking-wide"
      >
        <span className="relative z-10">
          {generating ? (
            <span className="flex items-center justify-center gap-2 text-white">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {cascade && hasBlog && hasOtherFormats ? t('output.cascade.generating') : t('output.generating')}
            </span>
          ) : (
            t('output.generate')
          )}
        </span>
      </button>
    </div>
  )
}
