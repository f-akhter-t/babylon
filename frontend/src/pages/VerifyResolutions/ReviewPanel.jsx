import { useRef, useState } from 'react'
import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'
import { isReopenedInQueue, REJECT_REASON_NEEDED } from '../../services/api'
import { reopenedSentence } from './reopenedText'
import { fit, REGION_FOCUS, useFitMode } from '../../components/layout/staffFit'
import { useT } from '../../i18n/useLanguage'

// Approve needs the first two checks in either list.
const CHECKS = [
  'Same location as the original report',
  'The problem is visibly fixed',
  'Photo was taken after work started',
]

// A reopened issue the admin sent here has no new after-photo. Approving it
// dismisses the reopening and closes the issue again.
const REOPENED_INTRO = 'Approve only if the earlier fix still holds. Otherwise send it back with a reason.'
const REOPENED_CHECKS = [
  'The new reports are about the same place as the earlier fix.',
  'The earlier fix still holds, so the issue can be closed again.',
  'I have looked at the photo from the new report.',
]

const APPROVE_REASON_ID = 'approve-needs-checks'
const REJECT_ERROR_ID = 'reject-reason-error'

export default function ReviewPanel({ issue, onApprove, onReject, busy = false }) {
  const t = useT()
  const [checked, setChecked] = useState([false, false, false])
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const reasonRef = useRef(null)
  const fitMode = useFitMode()
  const reopened = isReopenedInQueue(issue)
  const checks = reopened ? REOPENED_CHECKS : CHECKS

  const canApprove = checked[0] && checked[1]

  // A reason is needed to send a fix back (the API checks it again).
  function reject() {
    if (!reason.trim()) {
      setReasonError(REJECT_REASON_NEEDED)
      reasonRef.current?.focus()
      return
    }
    setReasonError('')
    onReject(issue, reason)
  }

  // Stays focusable when the checks are missing (aria-disabled), so the
  // reason under it is read out. Really disabled only while saving.
  function approve() {
    if (!canApprove) return
    onApprove(issue)
  }

  function toggle(index) {
    setChecked((list) => list.map((value, i) => (i === index ? !value : value)))
  }

  // The details scroll inside the panel in fit mode; the buttons stay pinned
  // below them.
  return (
    <div className={clsx('flex min-w-0 flex-col rounded-panel bg-mint', fit.column)}>
      <div
        role={fitMode ? 'region' : undefined}
        aria-label={fitMode ? t('Fix details') : undefined}
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
                {reopenedSentence(issue, t)}
              </p>
            ) : (
              <p className="mt-1 break-words font-body text-sm text-muted">
                {t('{location}. Reported on {reported}. {department} marked it done on {done}.', { location: issue.location, reported: issue.reportedOn, department: issue.department, done: issue.submittedOn })}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate/15 px-3 py-1 font-body text-sm font-semibold text-navy">
            <StaircaseIcon level={3} className="text-soft" />
            {t('Awaiting check')}
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
            <p className="font-body text-sm font-bold text-navy">{t('Check before approving')}</p>
            {reopened && (
              <p className="mt-1 font-body text-sm text-navy">{t(REOPENED_INTRO)}</p>
            )}
            <div className="mt-2 flex flex-col gap-1">
              {checks.map((label, index) => (
                <label
                  key={label}
                  className="flex min-h-11 cursor-pointer items-center gap-3 font-body text-base text-navy"
                >
                  <input
                    type="checkbox"
                    checked={checked[index]}
                    onChange={() => toggle(index)}
                    className="h-6 w-6 shrink-0 accent-accent"
                  />
                  {t(label)}
                </label>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="font-body text-sm font-bold text-navy">{t('Department note')}</p>
            <p className="mt-2 break-words rounded-tile bg-white px-4 py-3 font-body text-base text-navy">
              {issue.departmentNote ?? t('No note added.')}
            </p>

            <label
              htmlFor="reject-reason"
              className="mt-4 block font-body text-sm font-bold text-navy"
            >
              {t('Reason, if sending back')}
            </label>
            <textarea
              ref={reasonRef}
              id="reject-reason"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (reasonError && e.target.value.trim()) setReasonError('')
              }}
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={reasonError ? REJECT_ERROR_ID : undefined}
              placeholder={t('Tell the department what is still wrong')}
              className="mt-2 w-full rounded-tile border border-navy/60 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      <div data-toast-clearance className="rounded-b-panel border-t border-navy/10 bg-mint px-4 py-3 sm:px-6 sm:py-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled={busy}
            aria-disabled={!canApprove || undefined}
            aria-describedby={!canApprove ? APPROVE_REASON_ID : undefined}
            onClick={approve}
            className={clsx(
              'min-h-11 rounded-full bg-forest px-3 py-2.5 font-body text-sm font-bold text-frost transition-opacity motion-reduce:transition-none sm:px-6 sm:text-base',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              // ! beats the global "button:not(:disabled)" pointer rule in index.css.
              canApprove && !busy ? 'hover:opacity-90' : 'cursor-not-allowed! opacity-50',
            )}
          >
            {t('Approve and close')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="min-h-11 rounded-full border-2 border-navy bg-white px-3 py-2.5 font-body text-sm font-bold text-navy transition-colors hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:px-6 sm:text-base"
          >
            {t('Reject and send back')}
          </button>
        </div>
        {!canApprove && (
          <p id={APPROVE_REASON_ID} className="mt-2 font-body text-sm text-navy">
            {t('Tick the first two checks to approve this fix.')}
          </p>
        )}
        {reasonError && (
          <p id={REJECT_ERROR_ID} role="alert" className="mt-2 font-body text-sm font-bold text-alert">
            {reasonError}
          </p>
        )}
      </div>
    </div>
  )
}
