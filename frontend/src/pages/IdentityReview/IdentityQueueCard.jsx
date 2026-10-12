import clsx from 'clsx'
import { formatDate } from '../../utils/format'

// "•••• 4821". Only the last 4 digits are ever known, so the length is not shown.
export function MaskedNid({ last4, className }) {
  return (
    <span className={className}>
      <span aria-hidden="true">{`•••• ${last4}`}</span>
      <span className="sr-only">{`NID ending in ${last4}`}</span>
    </span>
  )
}

export function SampleTag() {
  return (
    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-body text-xs font-bold text-slate">
      Sample
    </span>
  )
}

export function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div key={n} className="rounded-card bg-mint p-4 motion-safe:animate-pulse">
          <div className="h-4 w-2/3 rounded-full bg-navy/10" />
          <div className="mt-2 h-3 w-5/6 rounded-full bg-navy/10" />
          <div className="mt-4 h-3 w-1/2 rounded-full bg-navy/10" />
        </div>
      ))}
    </div>
  )
}

export default function IdentityQueueCard({ submission, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(submission)}
      aria-current={selected ? 'true' : undefined}
      className={clsx(
        'w-full rounded-card border-2 bg-mint p-4 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        selected ? 'border-brand' : 'border-transparent hover:border-brand/50',
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
        <span className="text-slate">{`Sent on ${formatDate(submission.submittedAt)}`}</span>
      </span>
    </button>
  )
}
