import { useCallback, useContext } from 'react'
import { LanguageContext } from './languageContext'
import { localizeDigits, translate } from './translate'

export function useLanguage() {
  return useContext(LanguageContext)
}

// const t = useT();  t('Explore the map');  t('Hello, {name}', { name })
export function useT() {
  const { lang } = useContext(LanguageContext)
  return useCallback((text, vars) => translate(lang, text, vars), [lang])
}

// const n = useNumber();  n(12) -> "১২" in Bangla
export function useNumber() {
  const { lang } = useContext(LanguageContext)
  return useCallback((value) => localizeDigits(lang, value), [lang])
}
