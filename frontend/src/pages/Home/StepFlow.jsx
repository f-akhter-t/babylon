import { ArrowRightIcon } from './HomeIcons'

export default function StepFlow() {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span className="rounded-full border border-amber px-4 py-1.5 text-amber">Open</span>
      <ArrowRightIcon className="size-4 text-white" />
      <span className="rounded-full border border-white/60 px-4 py-1.5 text-white">
        In progress
      </span>
      <ArrowRightIcon className="size-4 text-white" />
      <span className="rounded-full bg-brand px-4 py-1.5 text-navy">Resolved</span>
    </div>
  )
}