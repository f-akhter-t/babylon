import { createContext } from 'react'

// The chosen site language ('en' or 'bn') and a setter.
export const LanguageContext = createContext({ lang: 'en', setLang: () => {} })
