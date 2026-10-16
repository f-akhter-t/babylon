import Button from '../../components/ui/Button'

// Grey placeholder cards shaped like IssueCard, shown while issues load.
export function SkeletonCards({ count = 4 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton flex gap-3 rounded-tile bg-mint p-4">
          <div className="h-8 w-6 rounded-md bg-mint-deep" />
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="h-4 w-4/5 rounded-full bg-mint-deep" />
            <div className="h-3 w-1/2 rounded-full bg-mint-deep" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-mint-deep" />
              <div className="h-6 w-14 rounded-full bg-mint-deep" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// A friendly message with an optional button (Try again, Clear filters).
export function StateMessage({ title, text, actionLabel, onAction, role }) {
  return (
    <div role={role} className="flex flex-col items-center gap-2 rounded-tile bg-mint px-5 py-8 text-center">
      <span className="font-heading text-lg font-extrabold text-navy">{title}</span>
      <span className="text-sm text-slate">{text}</span>
      {onAction && (
        <Button variant="outline" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
