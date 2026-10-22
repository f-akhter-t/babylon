// Grey placeholder shaped like FixedIssueCard. Shown while data loads.
export default function FixedIssueSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="skeleton rounded-card bg-mint"
    >
      <div className="h-[164px] bg-mint-deep" />
      <div className="space-y-3 p-[22px]">
        <div className="h-6 w-3/4 rounded-full bg-mint-deep" />
        <div className="h-4 w-1/2 rounded-full bg-mint-deep" />
        <div className="h-8 w-2/3 rounded-full bg-mint-deep" />
      </div>
    </div>
  )
}