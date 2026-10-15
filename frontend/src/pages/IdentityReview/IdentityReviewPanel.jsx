import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import VerifyBadge from '../Profile/VerifyBadge'
import { MaskedNid, SampleTag } from './IdentityQueueCard'
import IdCardPhoto from './IdCardPhoto'
import { useIdentityPhoto } from './useIdentityPhoto'
import { formatDate } from '../../utils/format'
import { checkRejectReason, REJECT_REASON_MAX } from '../../utils/profileRules'
import { fit, REGION_FOCUS, useFitMode } from '../../components/layout/staffFit'

const PHOTO_NOTE_ID = 'identity-photo-note'
const SUGGESTED_REASON = 'Please send your NID again with a clear photo of the front of the card.'

// One submission under review: Approve, or Reject with a reason the citizen sees.
// A real submission can only be approved once its card photo has loaded.
// onDecide(decision, reason) returns a promise.
export default function IdentityReviewPanel({ submission, onDecide, focusOnOpen }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(null) // 'approve' | 'reject' | null
  const headingRef = useRef(null)
  const reasonRef = useRef(null)
  const photo = useIdentityPhoto(submission)
  const fitMode = useFitMode()

  const reasonError = checkRejectReason(reason)
  const reasonLength = reason.trim().length
  const photoBlocksApprove = !submission.sample && photo.kind !== 'photo'

  function applySuggestedReason() {
    setReason(SUGGESTED_REASON)
    reasonRef.current?.focus()
  }

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
    // The details scroll inside the panel in fit mode, with the buttons pinned
    // below them. When the page scrolls, the buttons stick to the window instead.
    <section
      aria-labelledby="identity-review-heading"
      className={clsx('flex flex-col rounded-panel bg-mint', fit.column, fit.grow)}
    >
      <div
        role={fitMode ? 'region' : undefined}
        aria-label={fitMode ? 'Submission details' : undefined}
        tabIndex={fitMode ? 0 : undefined}
        className={clsx(
          'rounded-t-panel px-3 pt-3 pb-4 sm:px-6 sm:pt-6',
          fit.scroll,
          fit.grow,
          fit.min48,
          REGION_FOCUS,
        )}
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
            <IdCardPhoto
              photo={photo}
              name={submission.name}
              noteId={PHOTO_NOTE_ID}
              onUseReason={applySuggestedReason}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="identity-reject-reason" className="block font-body text-sm font-bold text-navy">
            Reason, if rejecting
          </label>
          <textarea
            ref={reasonRef}
            id="identity-reject-reason"
            rows={3}
            maxLength={REJECT_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={Boolean(busy)}
            aria-describedby="identity-reject-hint"
            placeholder="For example: the photo is blurry, please take it again in good light."
            className="mt-2 w-full rounded-tile border border-navy/60 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest disabled:opacity-60"
          />
          <p id="identity-reject-hint" className="mt-1 font-body text-xs text-slate">
            {`The citizen will see this reason. Do not include their NID number. ${reasonLength} of ${REJECT_REASON_MAX} characters.`}
          </p>
        </div>

        {submission.sample && (
          <p className="mt-5 rounded-tile bg-amber/20 px-4 py-2.5 font-body text-sm text-navy">
            This sample has no photo to compare, so approve or reject to try the flow.
          </p>
        )}
      </div>

      <div className="sticky bottom-0 grid grid-cols-2 gap-3 rounded-b-panel border-t border-navy/10 bg-mint px-3 py-3 sm:px-6 sm:py-4">
        <Button
          variant="primary"
          size="md"
          className="whitespace-normal py-3.5 text-base"
          disabled={Boolean(busy) || photoBlocksApprove}
          aria-describedby={photoBlocksApprove && photo.kind !== 'loading' ? PHOTO_NOTE_ID : undefined}
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
