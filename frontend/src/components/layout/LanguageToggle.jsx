import clsx from 'clsx'
import { useLanguage, useT } from '../../i18n/useLanguage'

const OPTIONS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'bn', label: 'বাং', name: 'বাংলা' },
]

// Two small buttons: the page language switches at once and is remembered.
export default function LanguageToggle({ className }) {
  const { lang, setLang } = useLanguage()
  const t = useT()
  return (
    <div
      role="group"
      aria-label={t('Language')}
      className={clsx('inline-flex rounded-full border border-white/20 p-0.5 text-xs font-semibold', className)}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          title={option.name}
          aria-pressed={lang === option.code}
          onClick={() => setLang(option.code)}
          className={clsx(
            'rounded-full px-3 py-1.5 transition-colors max-lg:py-2',
            lang === option.code ? 'bg-mint text-navy' : 'text-white/80 hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
