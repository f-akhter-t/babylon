import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDistance } from '../../utils/format'
import { ArrowUpIcon } from './MapIcons'
import { animate, RISE_IN } from '../../components/ui/motion'

export default function IssueCard({ issue, selected, onSelect }) {
  const ref = useRef(null)
  const votesRef = useRef(null)
  const lastVotes = useRef(issue.votes)
  const rank = useRef(issue.rank)

  // Cards rise in one after another when they first appear.
  useEffect(() => {
    const delay = Math.min(rank.current - 1, 8) * 40
    animate(ref.current, RISE_IN, { duration: 350, delay, easing: 'ease-out', fill: 'backwards' })
  }, [])

  // When the vote count changes, make it "pop": green for up, red for down.
  useEffect(() => {
    if (issue.votes === lastVotes.current) return
    const up = issue.votes > lastVotes.current
    lastVotes.current = issue.votes
    animate(
      votesRef.current,
      [
        { transform: 'scale(1)' },
        {
          transform: 'scale(1.6)',
          color: up ? 'var(--color-forest)' : 'var(--color-danger)',
        },
        { transform: 'scale(1)' },
      ],
      { duration: 450, easing: 'ease-out' },
    )
  }, [issue.votes])

  // On wide screens the list scrolls on its own, so bring the selected card
  // into view. On phones the list is below the map, so we leave the page alone.
  useEffect(() => {
    if (selected && window.matchMedia('(min-width: 1024px)').matches) {
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selected])

  return (
    <article
      ref={ref}
      className={clsx(
        'relative flex gap-3 rounded-tile border-2 bg-mint p-4 transition duration-200 ease-out',
        'hover:shadow-lg motion-safe:hover:-translate-y-0.5',
        selected ? 'border-navy shadow-md' : 'border-transparent hover:border-navy/30',
      )}
    >
      <span className="w-8 shrink-0 font-heading text-3xl font-extrabold leading-none text-navy">
        {issue.rank}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* The ::after layer stretches this button over the whole card,
            so clicking anywhere on the card selects it. */}
        <button
          type="button"
          onClick={() => onSelect(issue.id)}
          aria-pressed={selected}
          className="text-left font-semibold leading-snug text-navy after:absolute after:inset-0 after:rounded-tile focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-navy"
        >
          {issue.title}
        </button>

        <span className="text-sm text-slate">
          {issue.category} · {formatDistance(issue.distanceM)} away
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          {/* Green when this citizen has upvoted it. */}
          <span
            ref={votesRef}
            className={clsx(
              'ml-auto flex origin-center items-center gap-1 text-sm font-semibold',
              issue.voted ? 'text-forest' : 'text-navy',
            )}
          >
            <ArrowUpIcon size={16} />
            <span className="sr-only">Upvotes:</span>
            {issue.votes}
          </span>
        </div>
      </div>
    </article>
  )
}
