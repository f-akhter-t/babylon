import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import LoadError from '../../components/ui/LoadError'
import LogoLoader from '../../components/ui/LogoLoader'
import IssueTable from './IssueTable'
import ResolvePanel from './ResolvePanel'
import WeeklySummaryCard from './WeeklySummaryCard'
import DivisionSelect from '../../components/ui/DivisionSelect'
import { useDivisionParam } from '../../hooks/useDivisionParam'
import ListToolbar from '../../components/ui/ListToolbar'
import Pager from '../../components/ui/Pager'
import { useListView } from '../../hooks/useListView'

import {
  ISSUES_EVENT,
  loadDepartmentPanel,
  startWork as startWorkOn,
  submitForVerification as sendForVerification,
} from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { resizeImage } from '../../utils/resizeImage'
import RequireRole from '../Auth/RequireRole'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ALL_ASSIGNED_LABEL, DEPARTMENT_FILTERS, filterFor, ISSUE_SORTS, issuesFor, issueText } from './departmentFilters'
import { fit } from '../../components/layout/staffFit'
import { useNumber, useT } from '../../i18n/useLanguage'

const PRIORITIES = ['urgent', 'high', 'medium']
const PRIORITY_NAMES = { urgent: 'Urgent priority', high: 'High priority', medium: 'Medium priority' }

// Keeps only the chosen division and priority ('' means no limit).
const narrow = (list, division, priority) =>
  list.filter((i) => (!division || i.division === division) && (!priority || i.priority === priority))

const PANEL_ID = 'resolve-panel'
const PANEL_HEADING_ID = 'resolve-panel-heading'

// Accounts made before departments were saved at sign-up have none.
const NO_DEPARTMENT =
  'This account has no department saved, so no issues can be shown. Please create a new staff account and choose your department.'
const LOAD_FAILED = 'We could not load your department’s issues. Please try again.'
const NO_ISSUES = Promise.resolve({ assigned: [], completed: [] })

// to: where the list behind this number is, so one click starts the work.
function StatCard({ label, value, level, iconClass, dark, note, to }) {
  const n = useNumber()
  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center justify-between gap-3 rounded-card px-5 py-3 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:block sm:py-4',
        dark ? 'bg-ink text-frost' : 'bg-mint text-navy',
      )}
    >
      <div className="flex items-center gap-2 font-body text-sm font-semibold">
        {level && <StaircaseIcon level={level} className={iconClass} />}
        {label}
      </div>
      <p
        className={clsx(
          'font-heading text-4xl font-extrabold sm:mt-2 sm:text-5xl',
          dark ? 'text-brand' : 'text-navy',
        )}
      >
        {n(value)}
      </p>
      {note && <p className="font-body text-xs text-frost/70 max-sm:hidden sm:mt-1">{note}</p>}
    </Link>
  )
}

// Department accounts only. Admins go to their own panel.
export default function DepartmentPanel() {
  return (
    <RequireRole role="department">
      <DepartmentPanelPage />
    </RequireRole>
  )
}

function DepartmentPanelPage() {
  const t = useT()
  const n = useNumber()
  useDocumentTitle('Department panel')
  const { department } = useViewer()
  const [searchParams] = useSearchParams()
  const status = filterFor(searchParams.get('status'))
  const [division, setDivision] = useDivisionParam()
  const priorityParam = searchParams.get('priority')
  const priority = PRIORITIES.includes(priorityParam) ? priorityParam : ''
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { tone: 'success' | 'error', text }
  const [submitError, setSubmitError] = useState(null) // shown in the Resolve panel
  // The Resolve panel is a disclosure: closed until an issue is picked. Closing
  // it only hides it, so a chosen photo and note are kept.
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusPanel, setFocusPanel] = useState(0) // bumped to move focus to the panel
  const panelHeadingRef = useRef(null)
  const headingRef = useRef(null)

  const load = useCallback(
    () => (department ? loadDepartmentPanel(department) : NO_ISSUES),
    [department],
  )
  const { data, error, loading, retry, reload } = useAsync(load)
  // The chosen division and priority narrow everything on the page.
  const issues = useMemo(() => narrow(data?.assigned ?? [], division, priority), [data, division, priority])
  const completed = useMemo(() => narrow(data?.completed ?? [], division, priority), [data, division, priority])

  // An issue changed (here, in another tab, or by the admin): show the latest.
  useEffect(() => {
    window.addEventListener(ISSUES_EVENT, reload)
    return () => window.removeEventListener(ISSUES_EVENT, reload)
  }, [reload])

  const shown = issuesFor(status, issues, completed)
  const view = useListView(shown, { searchText: issueText, sorts: ISSUE_SORTS, defaultSort: 'priority' })
  // Closed issues have nothing left to resolve, so they never open the panel.
  const selected =
    shown.find((issue) => issue.id === selectedId && issue.status !== 'resolved') ?? null

  // Picking an issue opens the panel and moves focus to its heading.
  useEffect(() => {
    if (focusPanel) panelHeadingRef.current?.focus()
  }, [focusPanel])

  function select(id) {
    // Closed issues have nothing to resolve, so they do not open the panel.
    const issue = [...issues, ...completed].find((item) => item.id === id)
    if (!issue || issue.status === 'resolved') return
    setSelectedId(id)
    setSubmitError(null)
    setPanelOpen(true)
    setFocusPanel((n) => n + 1)
  }

  function closePanel() {
    setPanelOpen(false)
    headingRef.current?.focus()
  }

  async function startWork(id) {
    setNotice(null)
    setBusy(true)
    try {
      const issue = await startWorkOn(id)
      window.dispatchEvent(new Event(ISSUES_EVENT))
      select(id)
      setNotice({ tone: 'success', text: t('Work has started on “{title}”.', { title: issue.title }) })
    } catch (err) {
      setNotice({ tone: 'error', text: t(err.message) })
    } finally {
      setBusy(false)
    }
  }

  // The photo is shrunk first, so it fits in this device's storage. If saving
  // fails, the panel stays open with the photo and note, to try again.
  async function submitForVerification(id, { note, file }) {
    setNotice(null)
    setSubmitError(null)
    setBusy(true)
    try {
      const photoUrl = await resizeImage(file)
      const issue = await sendForVerification(id, { note, photoUrl })
      window.dispatchEvent(new Event(ISSUES_EVENT))
      setSelectedId(null)
      closePanel()
      setNotice({
        tone: 'success',
        text: t('“{title}” was sent to the admin for verification.', { title: issue.title }),
      })
    } catch (err) {
      setSubmitError(t(err.message))
    } finally {
      setBusy(false)
    }
  }

  const heading = t(status ? DEPARTMENT_FILTERS[status].label : ALL_ASSIGNED_LABEL)

  const open = issues.filter((i) => i.status === 'open').length
  const inProgress = issues.filter(
    (i) => i.status === 'in-progress' && i.verification !== 'awaiting',
  ).length
  const awaiting = issues.filter((i) => i.verification === 'awaiting').length
  // Links keep the chosen division and priority.
  const keep = (extra, withPriority = true) => {
    const q = new URLSearchParams(extra)
    if (division) q.set('division', division)
    if (priority && withPriority) q.set('priority', priority)
    const text = q.toString()
    return text ? `/department?${text}` : '/department'
  }
  const tabs = [
    { key: null, label: ALL_ASSIGNED_LABEL, count: issues.length },
    { key: 'open', label: DEPARTMENT_FILTERS.open.label, count: open },
    { key: 'in-progress', label: DEPARTMENT_FILTERS['in-progress'].label, count: inProgress },
    { key: 'awaiting', label: DEPARTMENT_FILTERS.awaiting.label, count: awaiting },
    { key: 'completed', label: DEPARTMENT_FILTERS.completed.label, count: completed.length },
  ]

  if (error) {
    return (
      <AdminLayout variant="department" active={heading} department={department}>
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="break-words font-heading text-3xl font-extrabold text-navy sm:text-4xl">
            {heading}
          </h1>
          <div className="mt-6">
            <LoadError message={LOAD_FAILED} onRetry={retry} />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      variant="department"
      active={heading}
      department={department}
    >
      {/* One column below lg: heading, stat cards, Resolve panel, table.
          From lg: the panel moves to a column on the right while it is open. */}
      <div
        className={clsx(
          // The last row grows to fit a tall panel, so the heading rows never stretch.
          'grid grid-cols-1 gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-rows-[auto_auto_1fr] lg:p-8',
          panelOpen ? 'lg:grid-cols-[minmax(0,1fr)_min(22.5rem,40%)]' : 'lg:grid-cols-1',
        )}
      >
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="break-words rounded-tile font-heading text-3xl font-extrabold text-navy focus:outline-none sm:text-4xl"
          >
            {heading}
          </h1>
          <p className="mt-1 font-body text-base text-muted">
            {t('Ranked by priority. Urgent problems stay at the top.')}
          </p>
          {!department && (
            <p role="alert" className="mt-3 font-body text-base font-bold text-alert">
              {t(NO_DEPARTMENT)}
            </p>
          )}
          {notice && (
            <p
              role={notice.tone === 'error' ? 'alert' : 'status'}
              className={clsx(
                'mt-3 break-words font-body text-base font-bold',
                notice.tone === 'error' ? 'text-alert' : 'text-accent',
              )}
            >
              {notice.text}
            </p>
          )}
          {loading && (
            <LogoLoader label={t('Loading your department’s issues.')} compact className="mt-4" />
          )}
        </div>

        {!loading && (
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:col-start-1 lg:row-start-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard to={keep({ status: 'open' })} label={t('Open')} value={open} level={1} iconClass="text-warn" />
              <StatCard to={keep({ status: 'in-progress' })} label={t('In progress')} value={inProgress} level={2} iconClass="text-soft" />
              <StatCard to={keep({ status: 'awaiting' })} label={t('Awaiting admin check')} value={awaiting} dark note={t('With the admin')} />
            </div>
            {department && <WeeklySummaryCard />}
          </div>
        )}

        <section
          id={PANEL_ID}
          aria-labelledby={PANEL_HEADING_ID}
          hidden={!panelOpen}
          className={clsx(
            'min-w-0 max-w-full rounded-card bg-mint px-4 pt-4 sm:px-6 sm:pt-6',
            'lg:col-start-2 lg:row-span-3 lg:row-start-1',
            fit.scroll,
            fit.barPadding,
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2
              id={PANEL_HEADING_ID}
              ref={panelHeadingRef}
              tabIndex={-1}
              className="rounded-tile font-body text-xs font-bold uppercase tracking-widest text-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t('Resolve with proof')}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              className="min-h-11 rounded-full border border-navy/40 bg-white px-4 py-2 font-body text-sm font-bold text-navy hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t('Close')}
            </button>
          </div>
          <ResolvePanel
            key={selected?.id ?? 'none'}
            issue={selected}
            onSubmit={submitForVerification}
            busy={busy}
            error={submitError}
          />
        </section>

        {!loading && (
          <div className={clsx('flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-3', fit.column)}>
            <nav aria-label={t('Issue views')} className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.label}
                  to={keep(tab.key ? { status: tab.key } : {})}
                  aria-current={tab.key === status ? 'page' : undefined}
                  className={clsx(
                    'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none',
                    tab.key === status
                      ? 'border-ink bg-ink text-frost'
                      : 'border-navy/40 bg-white text-navy hover:bg-mint-deep',
                  )}
                >
                  {t(tab.label)}
                  <span className={clsx('rounded-full px-2 text-xs', tab.key === status ? 'bg-frost/20' : 'bg-mint-deep')}>
                    {n(tab.count)}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DivisionSelect value={division} onChange={setDivision} />
              {priority && (
                <Link
                  to={keep(status ? { status } : {}, false)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy/40 bg-white px-4 py-2 font-body text-sm font-bold text-navy hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t(PRIORITY_NAMES[priority])} <span aria-hidden="true">×</span>
                  <span className="sr-only">{t('Clear')}</span>
                </Link>
              )}
            </div>
            <ListToolbar
              view={view}
              sorts={ISSUE_SORTS}
              searchLabel={t('Search issues')}
              placeholder={t('Search by title, street or ward')}
            />
            {/* The whole page scrolls, so every row can use the full screen height. */}
            <div className="min-w-0 rounded-card">
              <IssueTable
                issues={view.pageItems}
                selectedId={selectedId}
                onSelect={select}
                onStart={startWork}
                busy={busy}
                panelId={PANEL_ID}
              />
              {department && view.total === 0 && (
                <p className="mt-3 font-body text-base text-navy">
                  {view.query ? t('No issues match your search.') : t('No issues match this filter.')}
                </p>
              )}
            </div>
            <Pager view={view} />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
