import { useState, useCallback, type ReactNode } from 'react'
import { LanguageContext, translations, type Lang } from './useLanguage'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('cc_lang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try { localStorage.setItem('cc_lang', newLang) } catch { /* storage unavailable: preference is not persisted */ }
  }, [])

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] || translations[key]?.en || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
