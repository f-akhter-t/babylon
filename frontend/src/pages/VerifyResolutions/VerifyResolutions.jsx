import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadError from '../../components/ui/LoadError'
import LogoLoader from '../../components/ui/LogoLoader'
import ReviewPanel from './ReviewPanel'
import ReopenedList from './ReopenedList'
import {
  approveResolution,
  isReopenedInQueue,
  ISSUES_EVENT,
  loadVerification,
  rejectResolution,
  sendReopenedToQueue,
} from '../../services/api'
import { bannerSentence, reopenedSentence } from './reopenedText'
import { useAsync } from '../../hooks/useAsync'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fit } from '../../components/layout/staffFit'
import { useT } from '../../i18n/useLanguage'

const PRIORITY_LABEL = {
  urgent: 'Urgent priority',
  high: 'High priority',
  medium: 'Medium priority',
  reopened: 'Reopened',
}

function QueueCard({ issue, selected, onSelect }) {
  const t = useT()
  const strong = issue.priority === 'urgent' || issue.priority === 'high'

  // aria-current marks the one being reviewed (not aria-pressed: picking it
  // again does not unpick it). The Identity queue works the same way.
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect(issue.id)}
      className={clsx(
        'w-full rounded-card border-2 bg-mint p-4 text-left transition-colors motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected ? 'border-navy' : 'border-transparent hover:border-navy/30',
      )}
    >
      <p className="break-words font-heading text-base font-bold text-navy">{issue.title}</p>
      <p className="mt-1 break-words font-body text-sm text-muted">
        {isReopenedInQueue(issue)
          ? reopenedSentence(issue, t)
          : t('{department} sent this on {date}.', { department: issue.department, date: issue.submittedOn })}
      </p>
      <span
        className={clsx(
          'mt-3 inline-block rounded-full px-3 py-1 font-body text-sm font-bold',
          strong ? 'bg-ink text-frost' : 'bg-white text-navy',
        )}
      >
        {t(PRIORITY_LABEL[issue.priority] ?? issue.priority)}
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

// ?view=reopened shows the reopened issues instead of the queue. Any other
// value shows the queue.
const VIEWS = {
  queue: {
    nav: 'Verification queue',
    heading: 'Verify resolutions',
    loading: 'Loading the verification queue.',
    loadError: 'We could not load the verification queue. Please try again.',
  },
  reopened: {
    nav: 'Reopened issues',
    heading: 'Reopened issues',
    loading: 'Loading the reopened issues.',
    loadError: 'We could not load the reopened issues. Please try again.',
  },
}

function VerifyResolutionsPage() {
  const t = useT()
  const [searchParams] = useSearchParams()
  const viewKey = searchParams.get('view') === 'reopened' ? 'reopened' : 'queue'
  const view = VIEWS[viewKey]
  useDocumentTitle(view.heading)
  const [selectedId, setSelectedId] = useState(null)
  // { tone: 'success' | 'error', text, view }: only shown on the view it came from.
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sendingId, setSendingId] = useState(null)
  const headingRef = useRef(null)
  const shownNotice = notice?.view === viewKey ? notice : null

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
      setNotice({ tone: 'success', text: message, view: 'queue' })
    } catch (err) {
      setNotice({ tone: 'error', text: t(err.message), view: 'queue' })
    } finally {
      setBusy(false)
    }
  }

  // A reopened issue goes to the queue and leaves this list (it reloads
  // through ISSUES_EVENT). Its button disappears, so focus moves to the heading.
  async function sendToQueue(issue) {
    setNotice(null)
    setSendingId(issue.id)
    try {
      await sendReopenedToQueue(issue.id)
      setNotice({
        tone: 'success',
        text: t('“{title}” was sent to the verification queue.', { title: issue.title }),
        view: 'reopened',
      })
      headingRef.current?.focus()
    } catch (err) {
      setNotice({ tone: 'error', text: err.message, view: 'reopened' })
    } finally {
      setSendingId(null)
    }
  }

  const noticeLine = shownNotice && (
    <p
      role={shownNotice.tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'mt-3 break-words font-body text-sm font-bold',
        shownNotice.tone === 'error' ? 'text-alert' : 'text-accent',
      )}
    >
      {shownNotice.text}
    </p>
  )

  if (error) {
    return (
      <AdminLayout variant="admin" active={view.nav}>
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
            {t(view.heading)}
          </h1>
          <div className="mt-6">
            <LoadError message={view.loadError} onRetry={retry} />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (viewKey === 'reopened') {
    return (
      <AdminLayout variant="admin" active={view.nav}>
        <div className={clsx('p-4 sm:p-6 lg:p-8', fit.page)}>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="rounded-tile font-heading text-3xl font-extrabold text-navy focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-4xl"
          >
            {t(view.heading)}
          </h1>
          <p className="mt-1 font-body text-base text-muted">
            {t('These problems were marked resolved, but citizens reported them again. Send one to the verification queue to approve or reject it there.')}
          </p>
          {noticeLine}
          {loading ? (
            <LogoLoader label={t(view.loading)} className="mt-2" />
          ) : (
            <ReopenedList issues={data.reopened} onSend={sendToQueue} sendingId={sendingId} />
          )}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout variant="admin" active={view.nav}>
      <div className={clsx('p-4 sm:p-6 lg:p-8', fit.page)}>
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          {t('Verify resolutions')}
        </h1>
        <p className="mt-1 font-body text-base text-muted">
          {t('Compare the citizen\'s photo with the department\'s after-photo, then approve or send it back.')}
        </p>

        {noticeLine}

        {reopened && (
          <div className="mt-5 flex flex-col items-start gap-3 rounded-card border border-amber-dark bg-amber/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0 break-words font-body text-base text-navy">
              <p className="font-bold">{t('A closed problem came back.')}</p>
              <p>{bannerSentence(reopened, t)}</p>
            </div>
            <Link
              to={`/issues/${reopened.id}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-ink px-5 py-2 font-body text-sm font-bold text-frost transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              {t('Review reopened issue')}
            </Link>
          </div>
        )}

        {loading ? (
          <LogoLoader label={t(view.loading)} className="mt-6" />
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
              <p id="verify-queue-label" className="font-body text-sm font-bold text-muted">
                {t('Waiting for your check')}
              </p>
              <ul
                aria-labelledby="verify-queue-label"
                className={clsx('-mx-1 mt-2 flex flex-col gap-3 p-1', fit.scroll, fit.min32)}
              >
                {queue.map((issue) => (
                  <li key={issue.id}>
                    <QueueCard
                      issue={issue}
                      selected={selected?.id === issue.id}
                      onSelect={setSelectedId}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {selected ? (
              <ReviewPanel
                key={selected.id}
                issue={selected}
                onApprove={(issue) =>
                  finish(
                    () => approveResolution(issue.id),
                    t('“{title}” was approved and closed.', { title: issue.title }),
                  )
                }
                onReject={(issue, reason) =>
                  finish(
                    () => rejectResolution(issue.id, reason),
                    t('“{title}” was sent back to {department}.', { title: issue.title, department: issue.department }),
                  )
                }
                busy={busy}
              />
            ) : (
              <div className="self-start rounded-panel bg-mint p-6 font-body text-base text-muted sm:p-8">
                {t('Nothing is waiting for your check.')}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
