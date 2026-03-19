import type { OutputFormat } from '../../types'
import { useLanguage } from '../../hooks/useLanguage'

interface FormatSelectorProps {
  value: OutputFormat[]
  onChange: (formats: OutputFormat[]) => void
}

const formatKeys: { value: OutputFormat; labelKey: string; descKey: string }[] = [
  { value: 'social', labelKey: 'format.social', descKey: 'format.social.desc' },
  { value: 'blog', labelKey: 'format.blog', descKey: 'format.blog.desc' },
  { value: 'thread', labelKey: 'format.thread', descKey: 'format.thread.desc' },
  { value: 'video', labelKey: 'format.video', descKey: 'format.video.desc' },
]

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const { t } = useLanguage()
  const allSelected = value.length === formatKeys.length

  const toggleFormat = (format: OutputFormat) => {
    if (value.includes(format)) {
      if (value.length > 1) {
        onChange(value.filter(f => f !== format))
      }
    } else {
      onChange([...value, format])
    }
  }

  const toggleAll = () => {
    if (allSelected) {
      onChange([value[0]])
    } else {
      onChange(formatKeys.map(f => f.value))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-text-secondary uppercase tracking-wide">{t('format.label')}</span>
        <button
          onClick={toggleAll}
          className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
            allSelected
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-text-secondary hover:text-primary border border-border hover:border-border-hover'
          }`}
        >
          {t('format.all')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {formatKeys.map(f => (
          <button
            key={f.value}
            onClick={() => toggleFormat(f.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all text-left ${
              value.includes(f.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-bg-card text-text-secondary hover:border-border-hover'
            }`}
          >
            <span className="font-medium block">{t(f.labelKey)}</span>
            <span className="text-xs opacity-70">{t(f.descKey)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
