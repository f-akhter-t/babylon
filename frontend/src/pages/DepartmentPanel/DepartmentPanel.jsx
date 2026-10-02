import { useEffect, useState } from 'react'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { getDepartmentSummary } from '../../services/api'

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
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getDepartmentSummary(DEPARTMENT).then(setSummary)
  }, [])

  return (
    <AdminLayout variant="department" active="Assigned issues" department={DEPARTMENT}>
      <div className="p-8">
        <h1 className="font-heading text-4xl font-extrabold text-navy">
          Assigned issues
        </h1>
        <p className="mt-1 font-body text-base text-muted">
          Ranked by priority. Urgent problems stay at the top.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <StatCard
            label="Open"
            value={summary?.open ?? '–'}
            level={1}
            iconClass="text-amber-dark"
          />
          <StatCard
            label="In progress"
            value={summary?.inProgress ?? '–'}
            level={2}
            iconClass="text-slate"
          />
          <StatCard
            label="Awaiting admin check"
            value={summary?.awaiting ?? '–'}
            dark
          />
        </div>
      </div>
    </AdminLayout>
  )
}