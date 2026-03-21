import type { Platform } from '../../types'
import { useLanguage } from '../../hooks/useLanguage'

interface PlatformPickerProps {
  value: Platform[]
  onChange: (platforms: Platform[]) => void
  cascade: boolean
  onCascadeChange: (cascade: boolean) => void
  showCascade: boolean
  enabledPlatforms?: Platform[]
}

const allPlatforms: { value: Platform; label: string; descKey: string; icon: string; settingKey?: string }[] = [
  { value: 'tiktok', label: 'TikTok', descKey: 'platform.tiktok.desc', icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.79a4.83 4.83 0 01-1-.1z' },
  { value: 'instagram', label: 'Instagram', descKey: 'platform.instagram.desc', icon: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z' },
  { value: 'pinterest', label: 'Pinterest', descKey: 'platform.pinterest.desc', icon: 'M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.387.806-2.424 1.81-2.424.854 0 1.266.641 1.266 1.41 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.481 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z' },
  { value: 'youtube', label: 'YouTube', descKey: 'platform.youtube.desc', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', settingKey: 'platform_youtube_enabled' },
  { value: 'linkedin', label: 'LinkedIn', descKey: 'platform.linkedin.desc', icon: 'M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z', settingKey: 'platform_linkedin_enabled' },
]

export function PlatformPicker({ value, onChange, cascade, onCascadeChange, showCascade, enabledPlatforms }: PlatformPickerProps) {
  const { t } = useLanguage()
  const platforms = enabledPlatforms
    ? allPlatforms.filter(p => enabledPlatforms.includes(p.value))
    : allPlatforms.filter(p => !p.settingKey) // Default: only show always-on platforms
  const allSelected = value.length === platforms.length

  const togglePlatform = (platform: Platform) => {
    if (value.includes(platform)) {
      if (value.length > 1) {
        onChange(value.filter(p => p !== platform))
      }
    } else {
      onChange([...value, platform])
    }
  }

  const toggleAll = () => {
    if (allSelected) {
      onChange([value[0]])
    } else {
      onChange(platforms.map(p => p.value))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-mono text-white font-bold uppercase tracking-[0.12em]">{t('platform.label')}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
              allSelected
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-text-secondary hover:text-accent border border-border hover:border-border-hover'
            }`}
          >
            {t('platform.all')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map(p => (
          <button
            key={p.value}
            onClick={() => togglePlatform(p.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all text-left ${
              value.includes(p.value)
                ? 'platform-card-selected'
                : 'border-border bg-bg-card text-text-secondary hover:border-border-hover'
            }`}
          >
            <span className="font-medium flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-70">
                <path d={p.icon} />
              </svg>
              {p.label}
            </span>
            <span className="text-xs opacity-70 block">{t(p.descKey)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
