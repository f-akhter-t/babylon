import clsx from 'clsx'
import { useT } from '../../i18n/useLanguage'
import { useTheme } from './useTheme'

// A round button for dark bars (the navbar, the staff sidebar): sun while the
// page is dark, moon while it is light, like a light switch.
export default function ThemeToggle({ className }) {
  const t = useT()
  const { dark, setTheme } = useTheme()
  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={t('Dark mode')}
      title={dark ? t('Switch to light mode') : t('Switch to dark mode')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={clsx(
        'grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-frost/20 text-frost transition-colors hover:bg-frost/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        )}
      </svg>
    </button>
  )
}
