import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadError from '../../components/ui/LoadError'
import LogoLoader from '../../components/ui/LogoLoader'
import ReviewPanel from './ReviewPanel'
import ReopenedList from './ReopenedList'
import DivisionSelect from '../../components/ui/DivisionSelect'
import { useDivisionParam } from '../../hooks/useDivisionParam'
import ListToolbar from '../../components/ui/ListToolbar'
import Pager from '../../components/ui/Pager'
import { useListView } from '../../hooks/useListView'
import {
  approveResolution,
  isReopenedInQueue,
  ISSUES_EVENT,
  loadVerification,
  rejectResolution,
  sendReopenedToQueue,
} from '../../services/api'
import { reopenedSentence } from './reopenedText'
import { useAsync } from '../../hooks/useAsync'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fit } from '../../components/layout/staffFit'
import { useNumber, useT } from '../../i18n/useLanguage'

const PRIORITY_LABEL = {
  urgent: 'Urgent priority',
  high: 'High priority',
  medium: 'Medium priority',
  reopened: 'Reopened',
}

// Search and sort for the queue (see hooks/useListView.js). Module level, so they never change.
const queueText = (issue) => [issue.title, issue.department, issue.location, issue.ward].filter(Boolean).join(' ')
const sentAt = (issue) => Date.parse(issue.submittedAt) || 0
const QUEUE_SORTS = {
  oldest: { label: 'Oldest first', compare: (a, b) => sentAt(a) - sentAt(b) },
  newest: { label: 'Newest first', compare: (a, b) => sentAt(b) - sentAt(a) },
  priority: { label: 'Priority', compare: null }, // the server's order
  department: {
    label: 'Department',
    compare: (a, b) => String(a.department).localeCompare(String(b.department)),
  },
}

const PRIORITY_CHIPS = ['urgent', 'high', 'medium', 'reopened']
const DAY_MS = 24 * 60 * 60 * 1000

// Quick look at the whole queue, and one-click filters for it.
function Overview({
  queue,
  now,
  priority,
  setPriority,
  department,
  setDepartment,
  division,
  setDivision,
  tiles,
  departmentRef,
}) {
  const t = useT()
  const n = useNumber()
  const counts = {}
  const departments = {}
  let oldest = Infinity
  for (const issue of queue) {
    counts[issue.priority] = (counts[issue.priority] ?? 0) + 1
    departments[issue.department] = (departments[issue.department] ?? 0) + 1
    const at = sentAt(issue)
    if (at && at < oldest) oldest = at
  }
  const days = Number.isFinite(oldest) ? Math.max(0, Math.floor((now - oldest) / DAY_MS)) : 0
  const urgent = (counts.urgent ?? 0) + (counts.high ?? 0)
  const chip = (active) =>
    clsx(
      'inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1 font-body text-sm font-bold transition-colors motion-reduce:transition-none',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      active ? 'border-ink bg-ink text-frost' : 'border-navy/40 bg-white text-navy hover:bg-mint-deep',
    )

  return (
    <section aria-label={t('Queue overview')} className="mt-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('Waiting'), n(queue.length), tiles.all, priority === '' && !department],
          [t('Urgent and high'), n(urgent), tiles.urgent, priority === 'attention'],
          [
            t('Oldest wait'),
            days === 0 ? t('Today') : days === 1 ? t('1 day') : t('{days} days', { days: n(days) }),
            tiles.oldest,
            false,
          ],
          [t('Departments'), n(Object.keys(departments).length), tiles.departments, department !== ''],
        ].map(([label, value, onClick, active]) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={clsx(
              'rounded-card px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none',
              active ? 'bg-ink text-frost' : 'bg-mint text-navy hover:bg-mint-deep',
            )}
          >
            <span
              className={clsx(
                'block font-body text-xs font-bold uppercase tracking-widest',
                active ? 'text-frost/80' : 'text-muted',
              )}
            >
              {label}
            </span>
            <span className="block font-heading text-2xl font-extrabold">{value}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={priority === ''}
          onClick={() => setPriority('')}
          className={chip(priority === '')}
        >
          {t('All')} <span className="text-xs">{n(queue.length)}</span>
        </button>
        {PRIORITY_CHIPS.filter((key) => counts[key]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={priority === key}
            onClick={() => setPriority(priority === key ? '' : key)}
            className={chip(priority === key)}
          >
            {t(PRIORITY_LABEL[key])} <span className="text-xs">{n(counts[key])}</span>
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <DivisionSelect value={division} onChange={setDivision} />
          <label className="flex items-center gap-2 font-body text-sm font-semibold text-muted">
            {t('Department')}
            <select
              ref={departmentRef}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="min-h-9 rounded-full border border-navy bg-white px-4 py-1 font-body text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">{t('All departments')}</option>
              {Object.keys(departments)
                .sort()
                .map((name) => (
                  <option key={name} value={name}>
                    {name} ({n(departments[name])})
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
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
        'w-full rounded-card border-2 bg-mint px-3 py-2.5 text-left transition-colors motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected ? 'border-navy' : 'border-transparent hover:border-navy/30',
      )}
    >
      <p className="line-clamp-2 break-words font-heading text-sm font-bold text-navy">{issue.title}</p>
      <p className="mt-0.5 line-clamp-1 break-words font-body text-xs text-muted">
        {isReopenedInQueue(issue)
          ? reopenedSentence(issue, t)
          : t('{department} sent this on {date}.', {
              department: issue.department,
              date: issue.submittedOn,
            })}
      </p>
      <span
        className={clsx(
          'mt-1.5 inline-block rounded-full px-2.5 py-0.5 font-body text-xs font-bold',
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
  const n = useNumber()
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
  const queue = useMemo(() => data?.queue ?? [], [data])
  const [now] = useState(() => Date.now())
  const [division, setDivision] = useDivisionParam()
  const [priority, setPriority] = useState(() => {
    const wanted = searchParams.get('priority')
    return PRIORITY_CHIPS.includes(wanted) ? wanted : ''
  })
  const [department, setDepartment] = useState('')
  const departmentRef = useRef(null)
  const inDivision = useMemo(() => (division ? queue.filter((i) => i.division === division) : queue), [queue, division])
  const filtered = useMemo(
    () =>
      inDivision.filter(
        (i) =>
          (!priority ||
            (priority === 'attention' ? i.priority === 'urgent' || i.priority === 'high' : i.priority === priority)) &&
          (!department || i.department === department),
      ),
    [inDivision, priority, department],
  )
  const list = useListView(filtered, {
    searchText: queueText,
    sorts: QUEUE_SORTS,
    defaultSort: 'oldest',
    pageSize: 15,
  })
  const reviewRef = useRef(null)

  // A department sent a fix, or another admin checked one: show the latest.
  useEffect(() => {
    window.addEventListener(ISSUES_EVENT, reload)
    return () => window.removeEventListener(ISSUES_EVENT, reload)
  }, [reload])

  const selected = filtered.find((issue) => issue.id === selectedId) ?? list.pageItems[0] ?? null

  // Below lg the review sits under the queue: picking an item brings it into view.
  function pick(id) {
    setSelectedId(id)
    if (!window.matchMedia('(min-width: 64rem)').matches) {
      requestAnimationFrame(() =>
        reviewRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      )
    }
  }

  // The four numbers at the top of the page each take you to the work behind them.
  const tiles = {
    all: () => {
      setPriority('')
      setDepartment('')
      list.setQuery('')
    },
    urgent: () => {
      setPriority('attention')
      list.setSortKey('priority')
    },
    oldest: () => {
      setPriority('')
      setDepartment('')
      list.setQuery('')
      list.setSortKey('oldest')
      const first = [...inDivision].sort(QUEUE_SORTS.oldest.compare)[0]
      if (first) pick(first.id)
    },
    departments: () => departmentRef.current?.focus(),
  }

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
        text: t('“{title}” was sent to the verification queue.', {
          title: issue.title,
        }),
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
          <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">{t(view.heading)}</h1>
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
            {t(
              'These problems were marked resolved, but citizens reported them again. Send one to the verification queue to approve or reject it there.',
            )}
          </p>
          {noticeLine}
          {loading ? (
            <LogoLoader label={t(view.loading)} className="mt-2" />
          ) : (
            <ReopenedList
              issues={division ? data.reopened.filter((i) => i.division === division) : data.reopened}
              onSend={sendToQueue}
              sendingId={sendingId}
            />
          )}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout variant="admin" active={view.nav}>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">{t('Verify resolutions')}</h1>
        <p className="mt-1 font-body text-base text-muted">
          {t("Compare the citizen's photo with the department's after-photo, then approve or send it back.")}
        </p>

        {noticeLine}

        {loading ? (
          <LogoLoader label={t(view.loading)} className="mt-6" />
        ) : (
          <>
            <Overview
              queue={inDivision}
              now={now}
              division={division}
              setDivision={setDivision}
              priority={priority}
              setPriority={setPriority}
              department={department}
              setDepartment={setDepartment}
              departmentRef={departmentRef}
              tiles={tiles}
            />
            {/* From lg: the queue on the left (its own short scroll), the review on
              the right. The page scrolls, so the review is never squeezed. */}
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[16.25rem_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col lg:sticky lg:top-4">
                <p id="verify-queue-label" className="font-body text-sm font-bold text-muted">
                  {t('Waiting for your check')} · {n(filtered.length)}
                </p>
                <div className="mt-2">
                  <ListToolbar
                    view={list}
                    sorts={QUEUE_SORTS}
                    searchLabel={t('Search the queue')}
                    placeholder={t('Search title or department')}
                  />
                </div>
                <ul
                  aria-labelledby="verify-queue-label"
                  className="-mx-1 mt-2 flex max-h-96 flex-col gap-2 overflow-y-auto p-1 lg:max-h-[calc(100dvh-20rem)] lg:min-h-48"
                >
                  {list.pageItems.map((issue) => (
                    <li key={issue.id}>
                      <QueueCard issue={issue} selected={selected?.id === issue.id} onSelect={pick} />
                    </li>
                  ))}
                  {list.total === 0 && queue.length > 0 && (
                    <li className="font-body text-sm text-muted">{t('No issues match your search.')}</li>
                  )}
                </ul>
                <Pager view={list} />
              </div>

              {selected ? (
                <div ref={reviewRef} className="min-w-0 scroll-mt-24 lg:contents">
                  <ReviewPanel
                    key={selected.id}
                    issue={selected}
                    onApprove={(issue) =>
                      finish(
                        () => approveResolution(issue.id),
                        t('“{title}” was approved and closed.', {
                          title: issue.title,
                        }),
                      )
                    }
                    onReject={(issue, reason) =>
                      finish(
                        () => rejectResolution(issue.id, reason),
                        t('“{title}” was sent back to {department}.', {
                          title: issue.title,
                          department: issue.department,
                        }),
                      )
                    }
                    busy={busy}
                  />
                </div>
              ) : (
                <div className="self-start rounded-panel bg-mint p-6 font-body text-base text-muted sm:p-8">
                  {t('Nothing is waiting for your check.')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
