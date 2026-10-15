import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { fit } from '../../components/layout/staffFit'

// Read only: every reopened issue, each linking to its detail page.
// issues: getReopenedIssues(). votes is how many citizens reported it again.
export default function ReopenedList({ issues }) {
  if (issues.length === 0) {
    return (
      <div className="mt-6 rounded-panel bg-mint p-6 font-body text-base text-navy sm:p-8">
        No reopened issues are waiting. When a fixed problem comes back, it will appear here.
      </div>
    )
  }

  return (
    <ul
      aria-label="Reopened issues"
      className={clsx('-mx-1 mt-6 flex flex-col gap-3 p-1', fit.scroll, fit.grow, fit.min32)}
    >
      {issues.map((issue) => (
        <li key={issue.id}>
          <Link
            to={`/issues/${issue.id}`}
            className="block min-h-11 rounded-card border border-amber-dark bg-amber/20 px-4 py-4 text-navy transition-colors hover:bg-amber/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none sm:px-5"
          >
            <span className="block break-words font-heading text-lg font-bold">
              {issue.title}
            </span>
            <span className="mt-1 block font-body text-sm">
              {`It belongs to ${issue.department}.`}
            </span>
            <span className="block font-body text-sm">
              {`It was first marked resolved on ${issue.reopenedFrom}.`}
            </span>
            <span className="block font-body text-sm font-bold">
              {issue.votes === 1
                ? 'One citizen has reported it again.'
                : `${issue.votes} citizens have reported it again.`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
