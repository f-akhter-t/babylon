import { useMemo } from 'react'
import { useLanguage } from './useLanguage'
import { localizeDigits, translate } from './translate'

// Dates, distances and "n days ago" in the chosen language (Bangla digits and
// Bangla month names in Bangla).
export function useFormat() {
  const { lang } = useLanguage()
  return useMemo(
    () => ({
      date: (value) =>
        new Date(value).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      distance: (meters) =>
        lang === 'bn'
          ? meters < 500
            ? `${localizeDigits(lang, meters)} মিটার`
            : `${localizeDigits(lang, (meters / 1000).toFixed(1))} কিমি`
          : meters < 500
            ? `${meters} m`
            : `${(meters / 1000).toFixed(1)} km`,
      daysAgo: (days) =>
        days === 1 ? translate(lang, '1 day ago') : translate(lang, '{count} days ago', { count: days }),
    }),
    [lang],
  )
}
