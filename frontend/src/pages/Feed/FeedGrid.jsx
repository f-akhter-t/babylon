import FeedCard from './FeedCard'
import { FadeUpCard, usePrefersReducedMotion } from './feedMotion'

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card bg-mint/60">
      <div className="h-40 animate-pulse bg-slate/20" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate/20" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate/20" />
        <div className="mt-3 h-6 w-full animate-pulse rounded-full bg-slate/10" />
      </div>
    </div>
  )
}

export default function FeedGrid({ issues, loading, onUpvote, onClearFilters }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading &&
          issues.map((issue, index) => (
            <FadeUpCard key={issue.id} index={index} reducedMotion={reducedMotion}>
              <FeedCard issue={issue} onUpvote={onUpvote} />
            </FadeUpCard>
          ))}
      </div>

      {!loading && issues.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🔍</span>
          <p className="font-body text-muted">No issues match these filters yet.</p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-1 font-body text-sm font-semibold text-forest underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}