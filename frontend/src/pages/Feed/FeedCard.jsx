import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function FeedCard({ issue, onUpvote }) {
  const [bump, setBump] = useState(false)
  const isFixed = issue.status === 'resolved' && issue.afterImg

  function handleClick() {
    onUpvote(issue)
    setBump(true)
    setTimeout(() => setBump(false), 300)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-navy/5 bg-mint shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <div className="relative h-40 shrink-0 overflow-hidden bg-slate/20">
        {isFixed ? (
          <BeforeAfterSlider before={issue.beforeImg} after={issue.afterImg} alt={issue.title} />
        ) : (
          <>
            <img
              src={issue.beforeImg}
              alt={issue.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden h-full w-full items-center justify-center font-body text-xs text-slate">
              Photo not available
            </div>
          </>
        )}
        <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-navy font-body text-xs font-bold text-white">
          {issue.rank}
        </span>
        <PriorityBadge priority={issue.priority} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link to={`/issues/${issue.id}`} className="flex min-h-11 items-center">
          <h3 className="font-heading text-base font-bold text-navy transition-colors group-hover:text-forest">
            {issue.title}
          </h3>
        </Link>
        <p className="font-body text-sm text-muted">{issue.location}</p>

        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <StatusPill status={issue.status} />
            {issue.status !== 'resolved' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-dark" />
              </span>
            )}
          </div>

          {issue.status === 'resolved' ? (
            <span className="flex items-center gap-1 rounded-full bg-mint-deep px-3 py-1.5 font-body text-xs font-semibold text-navy">
              ✓ {issue.votes}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              aria-pressed={issue.voted}
              aria-label={`${issue.voted ? 'Remove your vote from' : 'Upvote'} ${issue.title}, currently ${issue.votes} votes`}
              className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-body text-xs font-semibold transition max-md:min-h-11 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 ${
                issue.voted
                  ? 'border-forest bg-forest text-white hover:bg-forest/90'
                  : 'border-navy text-navy hover:bg-navy/10'
              }`}
            >
              ↑{' '}
              <span
                style={bump ? { display: 'inline-block', animation: 'voteBump 0.3s ease-out' } : undefined}
              >
                {issue.votes}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}