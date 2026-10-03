import { useState } from 'react'
import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'

const CHECKS = [
  'Same location as the original report',
  'The problem is visibly fixed',
  'Photo was taken after work started',
]

export default function ReviewPanel({ issue, onApprove, onReject }) {
  const [checked, setChecked] = useState([false, false, false])
  const [reason, setReason] = useState('')

  const canApprove = checked[0] && checked[1]

  function toggle(index) {
    setChecked((list) => list.map((value, i) => (i === index ? !value : value)))
  }

  return (
    <div className="rounded-panel bg-mint p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-extrabold text-navy">{issue.title}</h2>
          <p className="mt-1 font-body text-sm text-muted">
            {issue.location} · Reported {issue.reportedOn} · Marked done by{' '}
            {issue.department} on {issue.submittedOn}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate/15 px-3 py-1 font-body text-sm font-semibold text-navy">
          <StaircaseIcon level={3} className="text-slate" />
          Awaiting check
        </span>
      </div>

      <div className="mt-5">
        <BeforeAfterSlider />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="font-body text-sm font-bold text-navy">Check before approving</p>
          <div className="mt-3 flex flex-col gap-3">
            {CHECKS.map((label, index) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 font-body text-base text-navy"
              >
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={() => toggle(index)}
                  className="h-5 w-5 accent-forest"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="font-body text-sm font-bold text-navy">Department note</p>
          <p className="mt-2 rounded-tile bg-white px-4 py-3 font-body text-base text-navy">
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

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!canApprove}
          onClick={() => onApprove(issue)}
          className={clsx(
            'rounded-full bg-forest px-6 py-3.5 font-body text-base font-bold text-mint transition-opacity',
            canApprove ? 'hover:opacity-90' : 'cursor-not-allowed opacity-40',
          )}
        >
          Approve and close
        </button>
        <button
          type="button"
          onClick={() => onReject(issue, reason)}
          className="rounded-full border-2 border-navy bg-white px-6 py-3.5 font-body text-base font-bold text-navy transition-colors hover:bg-mint-deep"
        >
          Reject and send back
        </button>
      </div>
    </div>
  )
}