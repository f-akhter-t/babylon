import clsx from 'clsx'
import StatusPill from '../../components/ui/StatusPill'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { sentBackMessage } from './departmentFilters'

// A table where the list is at least 48rem wide; stacked cards when it is narrower
// (a phone, or the Resolve panel open beside it). Container queries, so it
// follows the list's own width.
const COLUMNS = '@3xl:grid-cols-[56px_minmax(0,1fr)_80px_150px_170px]'

const PRIORITY_LABEL = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
}

function StatusCell({ issue }) {
  if (issue.verification === 'awaiting') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate/15 px-3 py-1 font-body text-sm font-semibold text-navy">
        <StaircaseIcon level={3} className="text-slate" />
        Awaiting check
      </span>
    )
  }
  if (issue.sentBack) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate/15 px-3 py-1 font-body text-sm font-semibold text-navy">
        <StaircaseIcon level={2} className="text-slate" />
        Sent back
      </span>
    )
  }
  return <StatusPill status={issue.status} />
}

function ActionButton({ issue, onStart, onSelect, busy }) {
  const base =
    'min-h-11 w-full rounded-full px-4 py-2.5 font-body text-sm font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest'

  if (issue.verification === 'awaiting') {
    return (
      <button
        type="button"
        disabled
        className={clsx(base, 'cursor-not-allowed bg-slate/15 text-slate')}
      >
        Waiting for admin
      </button>
    )
  }

  if (issue.status === 'resolved') {
    return (
      <button
        type="button"
        disabled
        className={clsx(base, 'cursor-not-allowed bg-slate/15 text-slate')}
      >
        Closed
      </button>
    )
  }

  if (issue.status === 'open') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation()
          onStart(issue.id)
        }}
        className={clsx(
          base,
          'bg-forest text-mint',
          busy ? 'cursor-not-allowed opacity-40' : 'hover:bg-forest/90',
        )}
      >
        Start work
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(issue.id)
      }}
      className={clsx(
        base,
        'border border-forest bg-white text-forest hover:bg-mint-deep',
      )}
    >
      Add after-photo
    </button>
  )
}

export default function IssueTable({ issues, selectedId, onSelect, onStart, busy = false }) {
  return (
    <div className="@container rounded-card bg-mint">
      <div
        className={clsx(
          'sticky top-0 z-10 hidden items-center gap-4 rounded-t-card bg-mint-deep px-5 py-3 @3xl:grid',
          'font-body text-sm font-semibold text-navy',
          COLUMNS,
        )}
      >
        <span>Rank</span>
        <span>Issue</span>
        <span>Votes</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      {issues.map((issue) => (
        <div
          key={issue.id}
          onClick={() => onSelect(issue.id)}
          className={clsx(
            'grid cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 border-navy/10 px-4 py-4 last:rounded-b-card',
            '[&+&]:border-t @3xl:items-center @3xl:gap-4 @3xl:border-t @3xl:px-5',
            COLUMNS,
            issue.id === selectedId ? 'bg-white' : 'hover:bg-white/50',
          )}
        >
          <span className="font-heading text-2xl font-extrabold text-forest @3xl:text-3xl">
            {issue.rank}
          </span>

          <div className="min-w-0">
            <p className="break-words font-body text-base font-bold text-navy">{issue.title}</p>
            <p className="font-body text-sm text-muted">
              <span
                className={clsx(
                  'font-bold',
                  issue.priority === 'urgent' ? 'text-amber-dark' : 'text-forest',
                )}
              >
                {PRIORITY_LABEL[issue.priority] ?? issue.priority}
              </span>
              {' · '}
              {issue.location}
              {issue.ward ? `, ${issue.ward}` : ''}
            </p>
            {issue.sentBack && (
              <p className="mt-1 min-w-0 break-words font-body text-sm font-bold text-danger">
                {sentBackMessage(issue.sentBack)}
              </p>
            )}
          </div>

          {/* Cards: one wrapping line under the title. Table: three columns. */}
          <div className="col-start-2 flex flex-wrap items-center gap-3 @3xl:contents">
            <span className="font-body text-base font-bold text-navy">
              <span className="@3xl:hidden">
                {issue.votes === 1 ? '↑ 1 vote' : `↑ ${issue.votes} votes`}
              </span>
              <span className="hidden @3xl:inline">↑ {issue.votes}</span>
            </span>

            <StatusCell issue={issue} />

            <div className="w-full @md:w-auto @md:min-w-44 @3xl:w-full @3xl:min-w-0">
              <ActionButton issue={issue} onStart={onStart} onSelect={onSelect} busy={busy} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}