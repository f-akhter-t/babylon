import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import ReviewPanel from './ReviewPanel'
import { getVerificationQueue, getReopenedIssues } from '../../services/api'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'

const PRIORITY_LABEL = {
  urgent: 'Urgent priority',
  high: 'High priority',
  medium: 'Medium priority',
}

function QueueCard({ issue, selected, onSelect }) {
  const strong = issue.priority === 'urgent' || issue.priority === 'high'

  return (
    <button
      type="button"
      onClick={() => onSelect(issue.id)}
      className={clsx(
        'w-full rounded-card border-2 bg-mint p-4 text-left transition-colors',
        selected ? 'border-navy' : 'border-transparent hover:border-navy/30',
      )}
    >
      <p className="font-heading text-base font-bold text-navy">{issue.title}</p>
      <p className="mt-1 font-body text-sm text-muted">
        {issue.department} · submitted {issue.submittedOn}
      </p>
      <span
        className={clsx(
          'mt-3 inline-block rounded-full px-3 py-1 font-body text-sm font-bold',
          strong ? 'bg-navy text-mint' : 'bg-white text-navy',
        )}
      >
        {PRIORITY_LABEL[issue.priority] ?? issue.priority}
      </span>
    </button>
  )
}

// Admins only. Department accounts go to their own panel.
export default function VerifyResolutions() {
  return (
    <RequireRole role="admin">
      <VerifyResolutionsPage />
    </RequireRole>
  )
}

function VerifyResolutionsPage() {
  useDocumentTitle('Verify resolutions')
  const [queue, setQueue] = useState([])
  const [reopened, setReopened] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([getVerificationQueue(), getReopenedIssues()]).then(([q, r]) => {
      setQueue(q)
      setReopened(r[0] ?? null)
    })
  }, [])

  const selected = queue.find((issue) => issue.id === selectedId) ?? queue[0] ?? null

  function finish(issue, message) {
    setQueue((list) => list.filter((item) => item.id !== issue.id))
    setSelectedId(null)
    setNotice(message)
  }

  return (
    <AdminLayout variant="admin" active="Verification queue">
      <div className="p-8">
        <h1 className="font-heading text-4xl font-extrabold text-navy">
          Verify resolutions
        </h1>
        <p className="mt-1 font-body text-base text-muted">
          Compare the citizen&apos;s photo with the department&apos;s after-photo, then
          approve or send it back.
        </p>

        {notice && (
          <p className="mt-3 font-body text-sm font-bold text-forest">{notice}</p>
        )}

        {reopened && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-card border border-amber-dark bg-amber/20 px-5 py-4">
            <p className="font-body text-base text-navy">
              <span className="font-bold">A closed problem came back:</span> &quot;
              {reopened.title}&quot; was marked resolved on {reopened.reopenedFrom}.{' '}
              {reopened.votes} citizens have reported it again.
            </p>
            <Link
              to={`/issues/${reopened.id}`}
              className="shrink-0 rounded-full bg-navy px-5 py-3 font-body text-sm font-bold text-mint transition-opacity hover:opacity-90"
            >
              Review reopened issue
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-[270px_minmax(0,1fr)] items-start gap-6">
          <div>
            <p className="font-body text-sm font-bold text-muted">Waiting for your check</p>
            <div className="mt-3 flex flex-col gap-3">
              {queue.map((issue) => (
                <QueueCard
                  key={issue.id}
                  issue={issue}
                  selected={selected?.id === issue.id}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </div>

          {selected ? (
            <ReviewPanel
              key={selected.id}
              issue={selected}
              onApprove={(issue) =>
                finish(issue, `Approved and closed: ${issue.title}`)
              }
              onReject={(issue) =>
                finish(issue, `Sent back to ${issue.department}: ${issue.title}`)
              }
            />
          ) : (
            <div className="rounded-panel bg-mint p-8 font-body text-base text-muted">
              Nothing is waiting for your check.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}