import StatusPill from '../../components/ui/StatusPill'
import CategoryChip from '../../components/ui/CategoryChip'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDaysAgo } from '../../utils/format'

// Chips, title, who reported it and when, and the description.
export default function IssueSummary({ issue }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={issue.status} />
        <CategoryChip label={issue.category} className="py-1" />
        <PriorityBadge priority={issue.priority} />
      </div>
      <h1 className="break-words font-heading text-3xl font-extrabold leading-tight text-navy sm:text-4xl lg:text-5xl">
        {issue.title}
      </h1>
      <p className="text-sm text-slate">
        Reported by {issue.reporter} on {issue.reportedOn}
        <span aria-hidden="true"> · </span>
        <span className="font-semibold">{formatDaysAgo(issue.daysAgo)}</span>
      </p>
      <p className="leading-relaxed text-navy">{issue.description}</p>
    </div>
  )
}
