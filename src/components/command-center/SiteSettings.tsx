import { useSiteSetting } from '../../hooks/useSiteSettings'
import { useLanguage } from '../../hooks/useLanguage'

function SettingToggle({ label, description, setting }: {
  label: string
  description: string
  setting: { value: boolean | null; loading: boolean; update: (v: boolean) => void }
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <button
        type="button"
        disabled={setting.loading}
        onClick={() => setting.update(!setting.value)}
        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
          setting.value ? 'bg-primary' : 'bg-border'
        } ${setting.loading ? 'opacity-40' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
            setting.value ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function SiteSettings() {
  const { lang, setLang, t } = useLanguage()
  const contactForm = useSiteSetting('contact_form_enabled', true)
  const perplexityHashtags = useSiteSetting('perplexity_hashtags_enabled', false)
  const extraPlatform = useSiteSetting('extra_platform_youtube', true) // true = YouTube, false = LinkedIn

  return (
    <div>
      <p className="font-display text-xs font-medium tracking-wider text-primary mb-4">
        {t('settings.site')}
      </p>

      <div className="space-y-4">
        <SettingToggle
          label={t('settings.contact')}
          description={contactForm.value ? t('settings.contact.on') : t('settings.contact.off')}
          setting={contactForm}
        />
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <p className="font-display text-xs font-medium tracking-wider text-primary mb-4">
          {t('settings.generation')}
        </p>
        <div className="space-y-4">
          <SettingToggle
            label={t('settings.perplexity')}
            description={perplexityHashtags.value ? t('settings.perplexity.on') : t('settings.perplexity.off')}
            setting={perplexityHashtags}
          />
        </div>
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <p className="font-display text-xs font-medium tracking-wider text-primary mb-4">
          {t('settings.platforms')}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {extraPlatform.value ? 'YouTube Enabled' : 'LinkedIn Enabled'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {extraPlatform.value ? t('settings.youtube.on') : t('settings.linkedin.on')}
            </p>
          </div>
          <div className="flex rounded-md border border-border overflow-hidden shrink-0">
            <button
              onClick={() => extraPlatform.update(true)}
              className={`w-9 py-1.5 text-xs font-mono transition-all text-center ${
                extraPlatform.value
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              YT
            </button>
            <button
              onClick={() => extraPlatform.update(false)}
              className={`w-9 py-1.5 text-xs font-mono transition-all text-center ${
                !extraPlatform.value
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              LI
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <p className="font-display text-xs font-medium tracking-wider text-primary mb-4">
          {t('settings.language')}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{t('settings.lang.label')}</p>
          </div>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs font-mono transition-all ${
                lang === 'en'
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`px-3 py-1.5 text-xs font-mono transition-all ${
                lang === 'es'
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
