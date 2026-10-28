import clsx from 'clsx'
import { CheckIcon } from './DetailIcons'
import { DRAW_LINE, useEntrance } from './useEntrance'
import { useNumber, useT } from '../../i18n/useLanguage'

// One step: a round marker, a line to the next step, and the text.
// Desktop: the steps sit in a row. Phones: a vertical timeline.

const MARKERS = {
  done: 'bg-forest text-paper',
  current: 'bg-ink',
  todo: 'border-2 border-dashed border-navy/30 bg-white text-soft',
}

// Read out after the step name by screen readers.
const SPOKEN = {
  done: '(done)',
  current: '(current step)',
  todo: '(not reached yet)',
}

const LINE =
  'absolute left-5 top-12 bottom-2 w-0.5 -translate-x-1/2 rounded-full sm:left-12 sm:right-2 sm:top-5 sm:bottom-auto sm:h-0.5 sm:w-auto sm:translate-x-0 sm:-translate-y-1/2'

export default function ProgressStep({ step, last, reachedNext }) {
  const t = useT()
  const n = useNumber()
  // The green line "draws" towards the next step, one step after another.
  const lineRef = useEntrance(DRAW_LINE, { delay: 350 + step.number * 250, duration: 550 })

  let look = 'todo'
  if (step.done) look = 'done'
  else if (step.current) look = 'current'

  return (
    <li
      aria-current={step.current ? 'step' : undefined}
      className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:gap-3 sm:pb-0 sm:pr-3"
    >
      {!last && (
        <span
          ref={lineRef}
          aria-hidden="true"
          className={clsx(LINE, reachedNext ? 'bg-forest' : 'bg-ink/15')}
        />
      )}

      <span
        aria-hidden="true"
        className={clsx(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold',
          MARKERS[look],
          step.current && 'ring-4 ring-brand/40',
        )}
      >
        {look === 'done' && <CheckIcon size={18} />}
        {look === 'current' && (
          <>
            <span className="absolute size-3 rounded-full bg-brand/60 animate-ring-out" />
            <span className="relative size-3 rounded-full bg-brand" />
          </>
        )}
        {look === 'todo' && n(step.number)}
      </span>

      <div className="min-w-0 pt-2 sm:pt-0">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-navy">
          {t(step.label)}
          <span className="sr-only">{t(SPOKEN[look])}</span>
          {step.current && (
            <span aria-hidden="true" className="rounded-full bg-amber px-2 py-0.5 text-xs font-bold text-ink">
              {t('You are here')}
            </span>
          )}
        </h3>
        {step.lines.map((line) => (
          <p
            key={line.text}
            className={clsx(
              'mt-1 text-xs leading-snug',
              line.muted ? 'italic text-soft/85' : 'text-soft',
            )}
          >
            {t(line.key, line.vars)}
          </p>
        ))}
      </div>
    </li>
  )
}
