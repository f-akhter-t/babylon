import Button from '../../components/ui/Button'
import { POINTS_PER_REPORT } from '../../services/api'
import { useT, useNumber } from '../../i18n/useLanguage'

// Shown in place of the form once a report is saved. A small flag moment:
// a green and red mark, a warm line, then the two next steps.
export default function ThankYou({ onAnother }) {
  const t = useT()
  const n = useNumber()

  return (
    <section
      role="status"
      className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-mint-deep bg-white px-6 py-10 text-center"
    >
      <svg viewBox="0 0 30 18" width="72" height="43" aria-hidden="true" className="rounded-[4px] ring-1 ring-navy/15">
        <rect width="30" height="18" className="fill-flag-green" />
        <circle cx="13.5" cy="9" r="5" className="fill-flag-red" />
      </svg>
      <h2 className="font-heading text-3xl font-extrabold text-navy">
        {t('Thank you. Your city will remember you.')}
      </h2>
      <p className="font-body text-soft">
        {t('Your report is with the team. You earned {points} points.', { points: n(POINTS_PER_REPORT) })}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button to="/my-reports" variant="dark">{t('See my reports')}</Button>
        <Button variant="outline" onClick={onAnother}>{t('Report another issue')}</Button>
      </div>
    </section>
  )
}
