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
import { fit } from '../../components/layout/staffFit'

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
        'w-full rounded-card border-2 bg-mint p-4 text-left transition-colors motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
        selected ? 'border-navy' : 'border-transparent hover:border-navy/30',
      )}
    >
      <p className="break-words font-heading text-base font-bold text-navy">{issue.title}</p>
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
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
            Verify resolutions
          </h1>
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
      <div className={clsx('p-4 sm:p-6 lg:p-8', fit.page)}>
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
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
              'mt-3 break-words font-body text-sm font-bold',
              notice.tone === 'error' ? 'text-danger' : 'text-forest',
            )}
          >
            {notice.text}
          </p>
        )}

        {reopened && (
          <div className="mt-5 flex flex-col items-start gap-3 rounded-card border border-amber-dark bg-amber/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="min-w-0 break-words font-body text-base text-navy">
              <span className="font-bold">A closed problem came back:</span> &quot;
              {reopened.title}&quot; was marked resolved on {reopened.reopenedFrom}.{' '}
              {reopened.votes} citizens have reported it again.
            </p>
            <Link
              to={`/issues/${reopened.id}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-navy px-5 py-2 font-body text-sm font-bold text-mint transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest motion-reduce:transition-none"
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
          // From lg: the queue on the left, the review on the right. In fit mode
          // both scroll inside themselves and the review's buttons stay pinned.
          <div
            className={clsx(
              'mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16.25rem_minmax(0,1fr)]',
              fit.grow,
              fit.rows,
              fit.min80,
            )}
          >
            <div className={clsx('flex min-w-0 flex-col', fit.column)}>
              <p className="font-body text-sm font-bold text-muted">Waiting for your check</p>
              <div className={clsx('-mx-1 mt-2 flex flex-col gap-3 p-1', fit.scroll, fit.min32)}>
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
              <div className="self-start rounded-panel bg-mint p-6 font-body text-base text-muted sm:p-8">
                Nothing is waiting for your check.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
