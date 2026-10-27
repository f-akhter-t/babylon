import clsx from 'clsx'
import { useFormat } from '../../i18n/useFormat'
import { useT, useNumber } from '../../i18n/useLanguage'

// "•••• 4821". Only the last 4 digits are ever known, so the length is not shown.
export function MaskedNid({ last4, className }) {
  const t = useT()
  const num = useNumber()
  return (
    <span className={className}>
      <span aria-hidden="true">{`•••• ${num(last4)}`}</span>
      <span className="sr-only">{t('NID ending in {last4}', { last4 })}</span>
    </span>
  )
}

export function SampleTag() {
  const t = useT()
  return (
    <span className="rounded-full bg-ink/10 px-2.5 py-0.5 font-body text-xs font-bold text-soft">
      {t('Sample')}
    </span>
  )
}

export function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div key={n} className="skeleton rounded-card bg-mint p-4">
          <div className="h-4 w-2/3 rounded-full bg-ink/10" />
          <div className="mt-2 h-3 w-5/6 rounded-full bg-ink/10" />
          <div className="mt-4 h-3 w-1/2 rounded-full bg-ink/10" />
        </div>
      ))}
    </div>
  )
}

export default function IdentityQueueCard({ submission, selected, onSelect }) {
  const t = useT()
  const { date } = useFormat()
  return (
    <button
      type="button"
      onClick={() => onSelect(submission)}
      aria-current={selected ? 'true' : undefined}
      className={clsx(
        'group w-full cursor-pointer rounded-card border-2 p-4 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        selected ? 'border-brand bg-white' : 'border-transparent bg-mint hover:border-brand hover:bg-white',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-heading text-base font-bold text-navy">
          {submission.name}
        </span>
        {submission.sample && <SampleTag />}
      </span>
      <span className="mt-0.5 block break-all font-body text-sm text-muted">
        {submission.email}
      </span>
      <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-body text-sm text-navy">
        <MaskedNid last4={submission.nidLast4} className="font-semibold tracking-wider" />
        <span className="text-soft">{t('Sent on {date}', { date: date(submission.submittedAt) })}</span>
      </span>
      {/* Says what a click does, so the cards read as buttons and not as plain info. */}
      <span
        className={clsx(
          'mt-3 flex items-center gap-1.5 border-t border-navy/10 pt-3 font-body text-sm font-bold',
          selected ? 'text-accent' : 'text-navy group-hover:text-accent',
        )}
      >
        {selected ? t('Reviewing now') : t('Review')}
        {!selected && (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </span>
    </button>
  )
}
