import StatusPill from '../../components/ui/StatusPill'
import CategoryChip from '../../components/ui/CategoryChip'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDate, formatDaysAgo } from '../../utils/format'

// Chips, title, who reported it and when, and the description.
export default function IssueSummary({ issue }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={issue.status} />
        <CategoryChip label={issue.category} className="py-1" />
        <PriorityBadge priority={issue.priority} />
      </div>
      <h1
        id="issue-title"
        tabIndex={-1}
        className="break-words rounded-tile font-heading text-3xl font-extrabold leading-tight text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:text-4xl lg:text-5xl"
      >
        {issue.title}
      </h1>
      <p className="text-sm text-slate">
        Reported by {issue.reporter} on {issue.reportedOn}
        <span aria-hidden="true"> · </span>
        <span className="font-semibold">{formatDaysAgo(issue.daysAgo)}</span>
        {issue.editedAt && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="whitespace-nowrap rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-navy">
              {`Edited on ${formatDate(issue.editedAt)}`}
            </span>
          </>
        )}
      </p>
      <p className="leading-relaxed text-navy">{issue.description}</p>
    </div>
  )
}
