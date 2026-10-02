import { useEffect, useState } from 'react'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import IssueTable from './IssueTable'
import ResolvePanel from './ResolvePanel'
import { getDepartmentIssues } from '../../services/api'

const DEPARTMENT = 'Roads & Highways'

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

export default function DepartmentPanel() {
  const [issues, setIssues] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getDepartmentIssues(DEPARTMENT).then(setIssues)
  }, [])

  const selected = issues.find((issue) => issue.id === selectedId) ?? null

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

  const open = issues.filter((i) => i.status === 'open').length
  const inProgress = issues.filter(
    (i) => i.status === 'in-progress' && i.verification !== 'awaiting',
  ).length
  const awaiting = issues.filter((i) => i.verification === 'awaiting').length

  return (
    <AdminLayout variant="department" active="Assigned issues" department={DEPARTMENT}>
      <div className="flex min-h-screen">
        <div className="min-w-0 flex-1 p-8">
          <h1 className="font-heading text-4xl font-extrabold text-navy">
            Assigned issues
          </h1>
          <p className="mt-1 font-body text-base text-muted">
            Ranked by priority. Urgent problems stay at the top.
          </p>

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
              issues={issues}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStart={startWork}
            />
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