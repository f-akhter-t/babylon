import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { ArrowRightIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

const steps = [
  { label: 'Open', on: 'border-amber bg-amber text-ink', off: 'border-amber text-amber' },
  { label: 'In progress', on: 'border-mint bg-mint text-accent', off: 'border-mint text-frost' },
  { label: 'Resolved', on: 'border-brand bg-brand text-ink', off: 'border-brand text-brand' },
]

export default function StepFlow() {
  const t = useT()
  const [lit, setLit] = useState(-1)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const id = setInterval(() => setLit((n) => (n + 1) % steps.length), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
      {steps.map((step, i) => (
        <span key={step.label} className="contents">
          {i > 0 && <ArrowRightIcon className="size-4 text-frost" />}
          <span
            className={clsx(
              'inline-flex h-9 cursor-default select-none items-center rounded-full border-[1.5px] px-3.5 transition-colors duration-500',
              lit === i ? step.on : step.off,
            )}
          >
            {t(step.label)}
          </span>
        </span>
      ))}
    </div>
  )
}