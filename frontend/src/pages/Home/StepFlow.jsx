import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { ArrowRightIcon } from './HomeIcons'

const steps = [
  { label: 'Open', on: 'border-amber bg-amber text-navy', off: 'border-amber text-amber' },
  { label: 'In progress', on: 'border-mint bg-mint text-forest', off: 'border-mint text-mint' },
  { label: 'Resolved', on: 'border-brand bg-brand text-navy', off: 'border-brand text-brand' },
]

export default function StepFlow() {
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
          {i > 0 && <ArrowRightIcon className="size-4 text-mint" />}
          <span
            className={clsx(
              'inline-flex h-9 cursor-default select-none items-center rounded-full border-[1.5px] px-3.5 transition-colors duration-500',
              lit === i ? step.on : step.off,
            )}
          >
            {step.label}
          </span>
        </span>
      ))}
    </div>
  )
}