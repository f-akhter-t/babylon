import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import VerifyBadge from '../Profile/VerifyBadge'
import { MaskedNid, SampleTag } from './IdentityQueueCard'
import { formatDate } from '../../utils/format'
import { checkRejectReason, REJECT_REASON_MAX } from '../../utils/profileRules'

// Where the NID photo would be. The photo is never stored on this device
// (the same rule as the Profile page), so this says so instead of faking one.
function PhotoPlaceholder() {
  return (
    <div className="flex aspect-[86/54] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-tile border-2 border-dashed border-navy/25 bg-white/60 p-5 text-center">
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 text-slate"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3" />
      </svg>
      <p className="font-body text-sm font-bold text-navy">Card photo not stored</p>
      <p className="font-body text-xs text-slate">
        The card photo is not stored on this device. In the live system, it would load here from
        secure storage for this review only.
      </p>
    </div>
  )
}

// One submission under review: Approve, or Reject with a reason the citizen sees.
// onDecide(decision, reason) returns a promise.
export default function IdentityReviewPanel({ submission, onDecide, focusOnOpen }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(null) // 'approve' | 'reject' | null
  const headingRef = useRef(null)

  const reasonError = checkRejectReason(reason)
  const reasonLength = reason.trim().length

  useEffect(() => {
    if (focusOnOpen) headingRef.current?.focus()
  }, [focusOnOpen])

  async function decide(decision) {
    setBusy(decision)
    try {
      await onDecide(decision, reason)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      aria-labelledby="identity-review-heading"
      className="rounded-panel bg-mint p-3 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="identity-review-heading"
            ref={headingRef}
            tabIndex={-1}
            className="rounded-tile font-heading text-2xl font-extrabold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:text-3xl"
          >
            {submission.name}
          </h2>
          <p className="mt-1 break-all font-body text-sm text-muted">{submission.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {submission.sample && <SampleTag />}
          <VerifyBadge status="pending" />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 font-body text-sm sm:grid-cols-2">
        <div className="min-w-0 rounded-tile bg-white/70 px-3 py-3 sm:px-4">
          <dt className="font-bold text-slate">NID number</dt>
          <dd className="mt-1 text-base font-semibold tracking-wider text-navy">
            <MaskedNid last4={submission.nidLast4} />
          </dd>
        </div>
        <div className="min-w-0 rounded-tile bg-white/70 px-3 py-3 sm:px-4">
          <dt className="font-bold text-slate">Submitted</dt>
          <dd className="mt-1 text-base font-semibold text-navy">
            {formatDate(submission.submittedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="font-body text-sm font-bold text-navy">Photo of the front of the NID card</p>
        <div className="mt-2">
          <PhotoPlaceholder />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="identity-reject-reason" className="block font-body text-sm font-bold text-navy">
          Reason, if rejecting
        </label>
        <textarea
          id="identity-reject-reason"
          rows={3}
          maxLength={REJECT_REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={Boolean(busy)}
          aria-describedby="identity-reject-hint"
          placeholder="For example: the photo is blurry, please take it again in good light."
          className="mt-2 w-full rounded-tile border border-navy/20 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest disabled:opacity-60"
        />
        <p id="identity-reject-hint" className="mt-1 font-body text-xs text-slate">
          {`The citizen will see this reason. Do not include their NID number. ${reasonLength} of ${REJECT_REASON_MAX} characters.`}
        </p>
      </div>

      <p className="mt-5 rounded-tile bg-amber/20 px-4 py-2.5 font-body text-sm text-navy">
        This demo has no photo to compare, so approve or reject to try the flow.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          variant="primary"
          size="md"
          className="whitespace-normal py-3.5 text-base"
          disabled={Boolean(busy)}
          onClick={() => decide('approve')}
        >
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </Button>
        <Button
          variant="outline"
          size="md"
          className="whitespace-normal bg-white py-3.5 text-base"
          disabled={Boolean(busy) || Boolean(reasonError)}
          onClick={() => decide('reject')}
        >
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </Button>
      </div>
    </section>
  )
}
