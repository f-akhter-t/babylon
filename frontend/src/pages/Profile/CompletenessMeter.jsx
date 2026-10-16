import clsx from 'clsx'
import { profileProgress } from './profileProgress'
import { enter } from '../../components/ui/motion'

// Three steps of a staircase, one per section. Each turns green when that
// section is done; identity under review shows amber.
// tone: 'dark' on the navy summary card, 'light' on mint.
const HEIGHTS = {
  md: ['h-6', 'h-10', 'h-14'],
  lg: ['h-10', 'h-16', 'h-24'],
}

const BAR = {
  dark: { done: 'bg-brand', pending: 'bg-amber', todo: 'bg-mint/15' },
  light: { done: 'bg-forest', pending: 'bg-amber', todo: 'bg-navy/10' },
}

const SPOKEN = {
  done: 'done',
  pending: 'under review',
  todo: 'not done yet',
}

export default function CompletenessMeter({ profile, tone = 'dark', size = 'md' }) {
  const { steps, done } = profileProgress(profile)
  const dark = tone === 'dark'

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={clsx(
            'font-body font-semibold',
            size === 'lg' ? 'text-base' : 'text-sm',
            dark ? 'text-mint' : 'text-navy',
          )}
        >
          Profile completeness
        </p>
        <p className={clsx('font-body text-xs', dark ? 'text-mint/70' : 'text-slate')}>
          {`${done} of ${steps.length} done`}
        </p>
      </div>

      <ol className={clsx('mt-3 grid grid-cols-3 items-end', size === 'lg' ? 'gap-3' : 'gap-2')}>
        {steps.map((step, index) => (
          <li key={step.key} className="flex flex-col gap-1.5">
            <span
              aria-hidden="true"
              className={clsx(
                'block w-full origin-bottom rounded-t-lg transition-colors duration-500',
                HEIGHTS[size][index],
                BAR[tone][step.state],
              )}
              style={enter('grow-y', 0.3 + index * 0.15)}
            />
            <span
              className={clsx(
                'font-body text-xs font-semibold',
                dark ? 'text-mint/80' : 'text-navy',
              )}
            >
              {step.label}
              <span className="sr-only">{`: ${SPOKEN[step.state]}`}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
