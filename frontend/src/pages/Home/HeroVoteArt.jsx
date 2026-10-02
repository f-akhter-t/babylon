import StatusPill from '../../components/ui/StatusPill'
import HeroArtFrame from './HeroArtFrame'

// Picture for slide 2: one issue card with its vote count.
export default function HeroVoteArt({ issue }) {
  if (!issue) return <HeroArtFrame />

  return (
    <HeroArtFrame>
      <div className="w-full max-w-[380px] rounded-tile bg-white p-4 shadow-lg sm:p-5">
        <span className="inline-flex rounded-full bg-amber/30 px-3 py-1 text-xs font-bold text-navy">
          Already reported nearby
        </span>
        <p className="mt-3 font-heading text-lg font-extrabold leading-tight text-navy sm:text-xl">
          {issue.title}
        </p>
        <p className="mt-1 text-sm text-muted">{issue.location}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <StatusPill status={issue.status} />
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-extrabold text-navy">
            ↑ Upvote · {issue.votes}
          </span>
        </div>
      </div>
    </HeroArtFrame>
  )
}
