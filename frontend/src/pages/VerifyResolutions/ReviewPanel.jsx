import { useState } from 'react'
import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'
import { isReopenedInQueue, REJECT_REASON_NEEDED } from '../../services/api'
import { reopenedSentence } from './reopenedText'
import { fit, REGION_FOCUS, useFitMode } from '../../components/layout/staffFit'

const CHECKS = [
  'Same location as the original report',
  'The problem is visibly fixed',
  'Photo was taken after work started',
]

export default function ReviewPanel({ issue, onApprove, onReject, busy = false }) {
  const [checked, setChecked] = useState([false, false, false])
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const fitMode = useFitMode()

  const canApprove = checked[0] && checked[1]

  // A reason is needed to send a fix back (the API checks it again).
  function reject() {
    if (!reason.trim()) {
      setReasonError(REJECT_REASON_NEEDED)
      return
    }
    setReasonError('')
    onReject(issue, reason)
  }

  function toggle(index) {
    setChecked((list) => list.map((value, i) => (i === index ? !value : value)))
  }

  // The details scroll inside the panel in fit mode; the buttons stay pinned
  // below them. When the page scrolls, the buttons stick to the window instead.
  return (
    <div className={clsx('flex min-w-0 flex-col rounded-panel bg-mint', fit.column)}>
      <div
        role={fitMode ? 'region' : undefined}
        aria-label={fitMode ? 'Fix details' : undefined}
        tabIndex={fitMode ? 0 : undefined}
        className={clsx(
          '@container rounded-t-panel px-4 pt-4 pb-4 sm:px-6 sm:pt-6',
          fit.scroll,
          fit.grow,
          fit.min48,
          REGION_FOCUS,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words font-heading text-2xl font-extrabold text-navy sm:text-3xl">
              {issue.title}
            </h2>
            {/* A reopened issue sent by the admin was not marked done by anyone. */}
            {isReopenedInQueue(issue) ? (
              <p className="mt-1 break-words font-body text-sm font-bold text-navy">
                {reopenedSentence(issue)}
              </p>
            ) : (
              <p className="mt-1 break-words font-body text-sm text-muted">
                {issue.location} · Reported {issue.reportedOn} · Marked done by{' '}
                {issue.department} on {issue.submittedOn}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate/15 px-3 py-1 font-body text-sm font-semibold text-navy">
            <StaircaseIcon level={3} className="text-slate" />
            Awaiting check
          </span>
        </div>

        <div className="mt-5">
          <BeforeAfterSlider
            before={issue.beforeImg}
            after={issue.pendingAfterImg}
            title={issue.title}
          />
        </div>

        <div className="mt-6 grid gap-6 @2xl:grid-cols-2">
          <div>
            <p className="font-body text-sm font-bold text-navy">Check before approving</p>
            <div className="mt-2 flex flex-col gap-1">
              {CHECKS.map((label, index) => (
                <label
                  key={label}
                  className="flex min-h-11 cursor-pointer items-center gap-3 font-body text-base text-navy"
                >
                  <input
                    type="checkbox"
                    checked={checked[index]}
                    onChange={() => toggle(index)}
                    className="h-5 w-5 shrink-0 accent-forest"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="font-body text-sm font-bold text-navy">Department note</p>
            <p className="mt-2 break-words rounded-tile bg-white px-4 py-3 font-body text-base text-navy">
              {issue.departmentNote ?? 'No note added.'}
            </p>

            <label
              htmlFor="reject-reason"
              className="mt-4 block font-body text-sm font-bold text-navy"
            >
              Reason, if sending back
            </label>
            <textarea
              id="reject-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell the department what is still wrong"
              className="mt-2 w-full rounded-tile border border-navy/20 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 rounded-b-panel border-t border-navy/10 bg-mint px-4 py-3 sm:px-6 sm:py-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled={!canApprove || busy}
            onClick={() => onApprove(issue)}
            className={clsx(
              'min-h-11 rounded-full bg-forest px-3 py-2.5 font-body text-sm font-bold text-mint transition-opacity motion-reduce:transition-none sm:px-6 sm:text-base',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
              canApprove && !busy ? 'hover:opacity-90' : 'cursor-not-allowed opacity-40',
            )}
          >
            Approve and close
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="min-h-11 rounded-full border-2 border-navy bg-white px-3 py-2.5 font-body text-sm font-bold text-navy transition-colors hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none sm:px-6 sm:text-base"
          >
            Reject and send back
          </button>
        </div>
        {reasonError && (
          <p role="alert" className="mt-2 font-body text-sm font-bold text-danger">
            {reasonError}
          </p>
        )}
      </div>
    </div>
  )
}
