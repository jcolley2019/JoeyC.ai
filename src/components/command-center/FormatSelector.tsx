import type { OutputFormat } from '../../types'
import { useLanguage } from '../../hooks/useLanguage'

interface FormatSelectorProps {
  value: OutputFormat[]
  onChange: (formats: OutputFormat[]) => void
}

const contentFormats: { value: OutputFormat; labelKey: string; descKey: string }[] = [
  { value: 'social', labelKey: 'format.social', descKey: 'format.social.desc' },
  { value: 'blog', labelKey: 'format.blog', descKey: 'format.blog.desc' },
  { value: 'thread', labelKey: 'format.thread', descKey: 'format.thread.desc' },
]

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const { t } = useLanguage()
  const mediaMode = value.length === 1 && value[0] === 'video'

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-mono text-white font-bold uppercase tracking-[0.1em]">{t('format.label')}</span>
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
          {contentFormats.map(f => {
            const isSelected = value.includes(f.value)
            return (
              <button
                key={f.value}
                onClick={() => toggleFormat(f.value)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-border bg-bg-card text-text-secondary hover:border-border-hover'
                }`}
              >
                <span className="font-medium block">{t(f.labelKey)}</span>
                <span className="text-xs opacity-70">{t(f.descKey)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
