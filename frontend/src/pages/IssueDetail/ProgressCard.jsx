import { buildProgress } from './progressSteps'
import ProgressStep from './ProgressStep'
import { useT } from '../../i18n/useLanguage'

// "Progress, Step N of 3" with the three steps Open, In progress, Resolved.
export default function ProgressCard({ issue }) {
  const t = useT()
  const { current, steps, reopened } = buildProgress(issue)

  return (
    <section aria-labelledby="progress-heading" className="rounded-panel bg-mint p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="progress-heading" className="font-heading text-2xl font-extrabold text-navy">
          {t('Progress')}
        </h2>
        <p className="text-sm font-semibold text-slate">{t('Step {n} of {count}', { n: current, count: 3 })}</p>
      </div>

      {/* No gap between columns: each step's line runs up to the next marker. */}
      <ol className="mt-6 grid sm:grid-cols-3">
        {steps.map((step, index) => (
          <ProgressStep
            key={step.label}
            step={step}
            last={index === steps.length - 1}
            reachedNext={current > step.number}
          />
        ))}
      </ol>

      {reopened && (
        <p className="mt-4 rounded-tile bg-amber/30 px-3 py-2 text-sm font-semibold text-navy">
          {t(reopened.key, reopened.vars)}
        </p>
      )}
    </section>
  )
}
