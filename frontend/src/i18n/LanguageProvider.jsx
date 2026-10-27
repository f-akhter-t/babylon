import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './languageContext'

const STORAGE_KEY = 'babylon-lang'

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'
  } catch {
    return 'en'
  }
}

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readSaved)

  const setLang = useCallback((next) => {
    const value = next === 'bn' ? 'bn' : 'en'
    setLangState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Private mode: the choice just lasts until the page closes.
    }
  }, [])

  // Screen readers and browsers pick the right voice and spell-checker.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
