import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import LoadError from '../../components/ui/LoadError'
import IssueTable from './IssueTable'
import ResolvePanel from './ResolvePanel'
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
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { ALL_ASSIGNED_LABEL, DEPARTMENT_FILTERS, filterFor, issuesFor } from './departmentFilters'

// Accounts made before departments were saved at sign-up have none.
const NO_DEPARTMENT =
  'This account has no department saved, so no issues can be shown. Please create a new staff account and choose your department.'
const LOAD_FAILED = 'We could not load your department’s issues. Please try again.'
const NO_ISSUES = Promise.resolve({ assigned: [], completed: [] })

function StatCard({ label, value, level, iconClass, dark }) {
  return (
    <div
      className={clsx(
        'rounded-card px-5 py-4',
        dark ? 'bg-navy text-mint' : 'bg-mint text-navy',
      )}
    >
      <div className="flex items-center gap-2 font-body text-sm font-semibold">
        {level && <StaircaseIcon level={level} className={iconClass} />}
        {label}
      </div>
      <p
        className={clsx(
          'mt-2 font-heading text-5xl font-extrabold',
          dark ? 'text-brand' : 'text-navy',
        )}
      >
        {value}
      </p>
    </div>
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
  useDocumentTitle('Department panel')
  const { department } = useViewer()
  const [searchParams] = useSearchParams()
  const status = filterFor(searchParams.get('status'))
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { tone: 'success' | 'error', text }

  const load = useCallback(
    () => (department ? loadDepartmentPanel(department) : NO_ISSUES),
    [department],
  )
  const { data, error, loading, retry, reload } = useAsync(load)
  const issues = data?.assigned ?? []
  const completed = data?.completed ?? []

  // An issue changed (here, in another tab, or by the admin): show the latest.
  useEffect(() => {
    window.addEventListener(ISSUES_EVENT, reload)
    return () => window.removeEventListener(ISSUES_EVENT, reload)
  }, [reload])

  const shown = issuesFor(status, issues, completed)
  // Closed issues have nothing left to resolve, so they never open the panel.
  const selected =
    shown.find((issue) => issue.id === selectedId && issue.status !== 'resolved') ?? null

  async function startWork(id) {
    setNotice(null)
    setBusy(true)
    try {
      await startWorkOn(id)
      setSelectedId(id)
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  // The photo is shrunk first, so it fits in this device's storage.
  async function submitForVerification(id, { note, file }) {
    setNotice(null)
    setBusy(true)
    try {
      const photoUrl = await resizeImage(file)
      const issue = await sendForVerification(id, { note, photoUrl })
      setSelectedId(null)
      setNotice({ tone: 'success', text: `Sent to the admin for verification: ${issue.title}.` })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const heading = status ? DEPARTMENT_FILTERS[status].label : ALL_ASSIGNED_LABEL

  const open = issues.filter((i) => i.status === 'open').length
  const inProgress = issues.filter(
    (i) => i.status === 'in-progress' && i.verification !== 'awaiting',
  ).length
  const awaiting = issues.filter((i) => i.verification === 'awaiting').length

  if (error) {
    return (
      <AdminLayout variant="department" active={heading} department={department}>
        <div className="p-8">
          <h1 className="font-heading text-4xl font-extrabold text-navy">{heading}</h1>
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
      <div className="flex min-h-screen">
        <div className="min-w-0 flex-1 p-8">
          <h1 className="font-heading text-4xl font-extrabold text-navy">
            {heading}
          </h1>
          <p className="mt-1 font-body text-base text-muted">
            Ranked by priority. Urgent problems stay at the top.
          </p>
          {!department && (
            <p role="alert" className="mt-3 font-body text-base font-bold text-danger">
              {NO_DEPARTMENT}
            </p>
          )}
          {notice && (
            <p
              role={notice.tone === 'error' ? 'alert' : 'status'}
              className={clsx(
                'mt-3 font-body text-base font-bold',
                notice.tone === 'error' ? 'text-danger' : 'text-forest',
              )}
            >
              {notice.text}
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-4">
            <StatCard label="Open" value={open} level={1} iconClass="text-amber-dark" />
            <StatCard
              label="In progress"
              value={inProgress}
              level={2}
              iconClass="text-slate"
            />
            <StatCard label="Awaiting admin check" value={awaiting} dark />
          </div>

          <div className="mt-6">
            <IssueTable
              issues={shown}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStart={startWork}
            />
            {department && !loading && shown.length === 0 && (
              <p className="mt-3 font-body text-base text-navy">No issues match this filter.</p>
            )}
          </div>
        </div>

        <aside className="w-[390px] shrink-0 bg-mint p-6">
          <ResolvePanel
            key={selected?.id ?? 'none'}
            issue={selected}
            onSubmit={submitForVerification}
            busy={busy}
          />
        </aside>
      </div>
    </AdminLayout>
  )
}