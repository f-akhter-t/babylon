import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadError from '../../components/ui/LoadError'
import ReviewPanel from './ReviewPanel'
import {
  approveResolution,
  ISSUES_EVENT,
  loadVerification,
  rejectResolution,
} from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
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
  const [selectedId, setSelectedId] = useState(null)
  const [notice, setNotice] = useState(null) // { tone: 'success' | 'error', text }
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => loadVerification(), [])
  const { data, error, loading, retry, reload } = useAsync(load)
  const queue = data?.queue ?? []
  const reopened = data?.reopened[0] ?? null

  // A department sent a fix, or another admin checked one: show the latest.
  useEffect(() => {
    window.addEventListener(ISSUES_EVENT, reload)
    return () => window.removeEventListener(ISSUES_EVENT, reload)
  }, [reload])

  const selected = queue.find((issue) => issue.id === selectedId) ?? queue[0] ?? null

  // Saves the decision. The queue reloads through ISSUES_EVENT.
  async function finish(save, message) {
    setNotice(null)
    setBusy(true)
    try {
      await save()
      setSelectedId(null)
      setNotice({ tone: 'success', text: message })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <AdminLayout variant="admin" active="Verification queue">
        <div className="p-8">
          <h1 className="font-heading text-4xl font-extrabold text-navy">Verify resolutions</h1>
          <div className="mt-6">
            <LoadError
              message="We could not load the verification queue. Please try again."
              onRetry={retry}
            />
          </div>
        </div>
      </AdminLayout>
    )
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
          <p
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'mt-3 font-body text-sm font-bold',
              notice.tone === 'error' ? 'text-danger' : 'text-forest',
            )}
          >
            {notice.text}
          </p>
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

        {loading ? (
          <p role="status" className="mt-6 font-body text-base text-navy">
            Loading the verification queue.
          </p>
        ) : (
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
                  finish(
                    () => approveResolution(issue.id),
                    `“${issue.title}” was approved and closed.`,
                  )
                }
                onReject={(issue, reason) =>
                  finish(
                    () => rejectResolution(issue.id, reason),
                    `“${issue.title}” was sent back to ${issue.department}.`,
                  )
                }
                busy={busy}
              />
            ) : (
              <div className="rounded-panel bg-mint p-8 font-body text-base text-muted">
                Nothing is waiting for your check.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}