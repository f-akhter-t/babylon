import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import BeforeAfterSlider from './BeforeAfterSlider'
import { animate, DURATION, SPRING, VOTE_BUMP } from '../../components/ui/motion'
import { useNumber, useT } from '../../i18n/useLanguage'

// The vote count bumps when it changes: once for this person's own click,
// and once when another tab changes it. The live update that follows a click
// in this tab does not bump it a second time.
export default function FeedCard({ issue, onUpvote }) {
  const t = useT()
  const n = useNumber()
  const votesRef = useRef(null)
  const lastVotes = useRef(issue.votes)
  const clicked = useRef(false)
  const isFixed = issue.status === 'resolved' && issue.afterImg

  useEffect(() => {
    if (issue.votes === lastVotes.current) return
    lastVotes.current = issue.votes
    if (clicked.current) {
      clicked.current = false
      return
    }
    bumpVotes() // changed somewhere else
  }, [issue.votes])

  // Skipped for reduced motion and while the tab is hidden (see animate).
  function bumpVotes() {
    animate(votesRef.current, VOTE_BUMP, { duration: DURATION.slow, easing: SPRING })
  }

  function handleClick() {
    clicked.current = true
    onUpvote(issue)
    bumpVotes()
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-navy/5 bg-mint shadow-sm lift">
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
              {t('Photo not available')}
            </div>
          </>
        )}
        <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-navy font-body text-xs font-bold text-white">
          {n(issue.rank)}
        </span>
        <PriorityBadge priority={issue.priority} ai={issue.aiAssessed} className="absolute right-3 top-3 z-10" />
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
                <span className="absolute inline-flex h-full w-full animate-ring-out rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-dark" />
              </span>
            )}
          </div>

          {issue.status === 'resolved' ? (
            <span className="flex items-center gap-1 rounded-full bg-mint-deep px-3 py-1.5 font-body text-xs font-semibold text-navy">
              ✓ {n(issue.votes)}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              aria-pressed={issue.voted}
              aria-label={t(issue.voted ? 'Remove your vote from {title}, currently {votes} votes' : 'Upvote {title}, currently {votes} votes', { title: issue.title, votes: issue.votes })}
              className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 font-body text-xs font-semibold transition max-md:min-h-11 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 ${
                issue.voted
                  ? 'border-forest bg-forest text-white hover:bg-forest/90'
                  : 'border-navy text-navy hover:bg-navy/10'
              }`}
            >
              ↑{' '}
              <span
                ref={votesRef}
                className="inline-block"
              >
                {n(issue.votes)}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}