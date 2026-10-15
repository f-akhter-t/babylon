import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { fit } from '../../components/layout/staffFit'
import { votesSinceSentence } from './reopenedText'

const CONTROL =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-center font-body text-sm font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest'

// Every reopened issue, each with two controls: send it to the verification
// queue, or open its issue page. issues: getReopenedIssues().
// sendingId: the issue being saved, if any.
export default function ReopenedList({ issues, onSend, sendingId = null }) {
  if (issues.length === 0) {
    return (
      <div className="mt-6 rounded-panel bg-mint p-6 font-body text-base text-navy sm:p-8">
        No reopened issues are waiting. When a fixed problem comes back, it will appear here.
      </div>
    )
  }

  const busy = sendingId !== null

  return (
    <ul
      aria-label="Reopened issues"
      className={clsx('-mx-1 mt-6 flex flex-col gap-3 p-1', fit.scroll, fit.grow, fit.min32)}
    >
      {issues.map((issue) => {
        const titleId = `reopened-${issue.id}-title`
        const sendId = `reopened-${issue.id}-send`
        const viewId = `reopened-${issue.id}-view`
        return (
          <li key={issue.id}>
            <article
              aria-labelledby={titleId}
              className="rounded-card border border-amber-dark bg-amber/20 px-4 py-4 text-navy sm:px-5"
            >
              <h2 id={titleId} className="break-words font-heading text-lg font-bold">
                {issue.title}
              </h2>
              <p className="mt-1 font-body text-sm">{`It belongs to ${issue.department}.`}</p>
              <p className="font-body text-sm">
                {`It was first marked resolved on ${issue.reopenedFrom}.`}
              </p>
              <p className="font-body text-sm font-bold">
                {votesSinceSentence(issue)}
              </p>

              {/* Named with the visible text and the issue title, for screen readers. */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  id={sendId}
                  aria-labelledby={`${sendId} ${titleId}`}
                  disabled={busy}
                  onClick={() => onSend(issue)}
                  className={clsx(
                    CONTROL,
                    'bg-navy text-mint',
                    busy ? 'cursor-not-allowed opacity-40' : 'hover:bg-navy/90',
                  )}
                >
                  {sendingId === issue.id ? 'Sending…' : 'Send to verification queue'}
                </button>
                <Link
                  id={viewId}
                  aria-labelledby={`${viewId} ${titleId}`}
                  to={`/issues/${issue.id}`}
                  className={clsx(CONTROL, 'border-2 border-navy bg-white text-navy hover:bg-mint-deep')}
                >
                  View issue page
                </Link>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
