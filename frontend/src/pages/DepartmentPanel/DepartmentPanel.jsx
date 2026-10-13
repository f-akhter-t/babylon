import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import IssueTable from './IssueTable'
import ResolvePanel from './ResolvePanel'
import { getCompletedDepartmentIssues, getDepartmentIssues } from '../../services/api'
import RequireRole from '../Auth/RequireRole'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { ALL_ASSIGNED_LABEL, DEPARTMENT_FILTERS, filterFor, issuesFor } from './departmentFilters'

// Accounts made before departments were saved at sign-up have none.
const NO_DEPARTMENT =
  'This account has no department saved, so no issues can be shown. Please create a new staff account and choose your department.'

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
  const [issues, setIssues] = useState([])
  const [completed, setCompleted] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!department) return
    getDepartmentIssues(department).then(setIssues)
    getCompletedDepartmentIssues(department).then(setCompleted)
  }, [department])

  const shown = issuesFor(status, issues, completed)
  // Closed issues have nothing left to resolve, so they never open the panel.
  const selected =
    shown.find((issue) => issue.id === selectedId && issue.status !== 'resolved') ?? null

  function startWork(id) {
    setIssues((list) =>
      list.map((issue) =>
        issue.id === id ? { ...issue, status: 'in-progress' } : issue,
      ),
    )
    setSelectedId(id)
  }

  function submitForVerification(id) {
    setIssues((list) =>
      list.map((issue) =>
        issue.id === id ? { ...issue, verification: 'awaiting' } : issue,
      ),
    )
    setSelectedId(null)
  }

  const heading = status ? DEPARTMENT_FILTERS[status].label : ALL_ASSIGNED_LABEL

  const open = issues.filter((i) => i.status === 'open').length
  const inProgress = issues.filter(
    (i) => i.status === 'in-progress' && i.verification !== 'awaiting',
  ).length
  const awaiting = issues.filter((i) => i.verification === 'awaiting').length

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
            {department && shown.length === 0 && (
              <p className="mt-3 font-body text-base text-navy">No issues match this filter.</p>
            )}
          </div>
        </div>

        <aside className="w-[390px] shrink-0 bg-mint p-6">
          <ResolvePanel
            key={selected?.id ?? 'none'}
            issue={selected}
            onSubmit={submitForVerification}
          />
        </aside>
      </div>
    </AdminLayout>
  )
}