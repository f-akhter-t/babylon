import StatusPill from '../../components/ui/StatusPill'
import HeroArtFrame from './HeroArtFrame'
import { CheckIcon } from './HomeIcons'

const steps = ['After-photo uploaded', 'Admin checked the fix', 'Issue closed']

// Picture for slide 3: a resolved issue with the proof steps ticked.
export default function HeroProofArt({ issue }) {
  if (!issue) return <HeroArtFrame />

  return (
    <HeroArtFrame>
      <div className="w-full max-w-[380px] rounded-tile bg-white p-4 shadow-lg sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-heading text-lg font-extrabold leading-tight text-navy sm:text-xl">
            {issue.title}
          </p>
          <StatusPill status={issue.status} />
        </div>
        <ul className="mt-4 space-y-2">
          {steps.map((step) => (
            <li key={step} className="flex items-center gap-3 text-sm font-semibold text-navy">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy text-brand">
                <CheckIcon className="size-3.5" />
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </HeroArtFrame>
  )
}
