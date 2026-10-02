import { ArrowRightIcon } from './HomeIcons'

export default function StepFlow() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
      <span className="inline-flex h-9 cursor-default select-none items-center rounded-full border-[1.5px] border-amber px-3.5 text-amber">
        Open
      </span>
      <ArrowRightIcon className="size-4 text-mint" />
      <span className="inline-flex h-9 cursor-default select-none items-center rounded-full border-[1.5px] border-mint px-3.5 text-mint">
        In progress
      </span>
      <ArrowRightIcon className="size-4 text-mint" />
      <span className="inline-flex h-9 cursor-default select-none items-center rounded-full bg-brand px-3.5 text-navy">
        Resolved
      </span>
    </div>
  )
}