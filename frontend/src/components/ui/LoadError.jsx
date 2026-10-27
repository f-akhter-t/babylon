import { useT } from '../../i18n/useLanguage'
// Shown when a page's data could not be loaded, with a way to try again.
// message is one whole sentence.
export default function LoadError({ message, onRetry }) {
  const t = useT()
  return (
    <div role="alert" className="rounded-card bg-mint p-6">
      <p className="font-body text-base font-bold text-danger">{t(message)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-full bg-navy px-6 py-3 font-body text-base font-bold text-mint transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none"
      >
        {t('Try again')}
      </button>
    </div>
  )
}
