import FeedCard from './FeedCard'
import Reveal from '../../components/ui/Reveal'

function SkeletonCard() {
  return (
    <div className="skeleton rounded-card bg-mint/60">
      <div className="h-40 bg-slate/20" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-slate/20" />
        <div className="h-3 w-1/2 rounded bg-slate/20" />
        <div className="mt-3 h-6 w-full rounded-full bg-slate/10" />
      </div>
    </div>
  )
}

export default function FeedGrid({ issues, loading, onUpvote, onClearFilters }) {
  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading &&
          issues.map((issue, index) => (
            <Reveal key={issue.id} index={index} className="h-full">
              <FeedCard issue={issue} onUpvote={onUpvote} />
            </Reveal>
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