import clsx from 'clsx'
import { CheckIcon } from '../IssueDetail/DetailIcons'
import { DRAW_LINE, useEntrance } from '../IssueDetail/useEntrance'
import { formatDate } from '../../utils/format'

// Submitted -> Under review -> Verified (or Rejected), drawn like the
// Progress card on the Issue detail page. look: 'done' | 'current' | 'todo' | 'rejected'
function buildSteps(identity) {
  const { status, submittedAt } = identity
  const sentLine = submittedAt ? `Sent on ${formatDate(submittedAt)}` : ''

  if (status === 'not-submitted') {
    return [
      { label: 'Submitted', look: 'current', line: 'Add your NID number and a photo' },
      { label: 'Under review', look: 'todo', line: 'Usually 1 to 2 working days' },
      { label: 'Verified', look: 'todo', line: 'Your reports show a Verified badge' },
    ]
  }
  if (status === 'pending') {
    return [
      { label: 'Submitted', look: 'done', line: sentLine },
      { label: 'Under review', look: 'current', line: 'Usually 1 to 2 working days' },
      { label: 'Verified', look: 'todo', line: 'Your reports show a Verified badge' },
    ]
  }
  if (status === 'rejected') {
    return [
      { label: 'Submitted', look: 'done', line: sentLine },
      { label: 'Under review', look: 'done', line: 'Checked by the admin' },
      { label: 'Rejected', look: 'rejected', line: 'See the reason below' },
    ]
  }
  return [
    { label: 'Submitted', look: 'done', line: sentLine },
    { label: 'Under review', look: 'done', line: 'Checked by the admin' },
    { label: 'Verified', look: 'done', line: 'Your reports show a Verified badge' },
  ]
}

const MARKERS = {
  done: 'bg-forest text-white',
  current: 'bg-navy',
  todo: 'border-2 border-dashed border-navy/30 bg-white text-slate',
  rejected: 'bg-danger text-white',
}

const SPOKEN = {
  done: '(done)',
  current: '(current step)',
  todo: '(not reached yet)',
  rejected: '(not approved)',
}

const LINE =
  'absolute left-5 top-12 bottom-2 w-0.5 -translate-x-1/2 rounded-full sm:left-12 sm:right-2 sm:top-5 sm:bottom-auto sm:h-0.5 sm:w-auto sm:translate-x-0 sm:-translate-y-1/2'

function Step({ step, number, last, reachedNext }) {
  // The green line draws towards the next step, one step after another.
  const lineRef = useEntrance(DRAW_LINE, { delay: 300 + number * 220, duration: 500 })

  return (
    <li
      aria-current={step.look === 'current' ? 'step' : undefined}
      className="relative flex gap-4 pb-5 last:pb-0 sm:flex-col sm:gap-3 sm:pb-0 sm:pr-3"
    >
      {!last && (
        <span
          ref={lineRef}
          aria-hidden="true"
          className={clsx(LINE, reachedNext ? 'bg-forest' : 'bg-navy/15')}
        />
      )}

      <span
        aria-hidden="true"
        className={clsx(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
          MARKERS[step.look],
          step.look === 'current' && 'ring-4 ring-brand/40',
        )}
      >
        {step.look === 'done' && <CheckIcon size={18} />}
        {step.look === 'rejected' && (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        )}
        {step.look === 'current' && (
          <>
            <span className="absolute size-3 rounded-full bg-brand/60 motion-safe:animate-ping" />
            <span className="relative size-3 rounded-full bg-brand" />
          </>
        )}
        {step.look === 'todo' && number}
      </span>

      <div className="min-w-0 pt-2 sm:pt-0">
        <h3 className="text-sm font-bold text-navy">
          {step.label}
          <span className="sr-only">{` ${SPOKEN[step.look]}`}</span>
        </h3>
        {step.line && <p className="mt-1 text-xs leading-snug text-slate">{step.line}</p>}
      </div>
    </li>
  )
}

export default function IdentityTimeline({ identity }) {
  const steps = buildSteps(identity)

  return (
    <ol aria-label="Identity check progress" className="grid sm:grid-cols-3">
      {steps.map((step, index) => (
        <Step
          key={step.label}
          step={step}
          number={index + 1}
          last={index === steps.length - 1}
          reachedNext={steps[index + 1]?.look === 'done' || steps[index + 1]?.look === 'rejected'}
        />
      ))}
    </ol>
  )
}
