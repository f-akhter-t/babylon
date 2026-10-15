import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadError from '../../components/ui/LoadError'
import { loadAccountability } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'

const PERIODS = [
  { label: 'Last 4 weeks', weeks: 4 },
  { label: 'Last 8 weeks', weeks: 8 },
]

function StatCard({ label, children, valueClass }) {
  return (
    <div className="rounded-card bg-navy px-6 py-5">
      <p className="font-body text-sm font-bold text-mint">{label}</p>
      <p
        className={clsx(
          'mt-2 font-heading text-5xl font-extrabold',
          valueClass ?? 'text-mint',
        )}
      >
        {children}
      </p>
    </div>
  )
}

function DepartmentTable({ departments }) {
  const columns = 'grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_70px_80px]'

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold text-navy">
        Department performance
      </h2>

      <div
        className={clsx(
          'mt-4 grid gap-4 font-body text-sm font-semibold text-muted',
          columns,
        )}
      >
        <span>Department</span>
        <span>Resolved of assigned</span>
        <span>Avg days</span>
        <span>Reopened</span>
      </div>

      {departments.map((d) => {
        const percent = Math.round((d.resolved / d.assigned) * 100)
        return (
          <div
            key={d.name}
            className={clsx(
              'grid items-center gap-4 border-t border-navy/10 py-4',
              'mt-3 font-body text-base font-bold text-navy',
              columns,
            )}
          >
            <span>{d.name}</span>
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-forest"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-sm">
                {d.resolved} / {d.assigned}
              </span>
            </div>
            <span>{d.avgDays}</span>
            <span>{d.reopened}</span>
          </div>
        )
      })}
    </div>
  )
}

function WeeklyChart({ weekly }) {
  return (
    <div className="mt-8 border-t border-navy/10 pt-5">
      <h3 className="font-body text-sm font-bold text-navy">Reports per week</h3>

      <div className="mt-3 h-[220px] text-muted">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weekly} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid
              stroke="currentColor"
              strokeOpacity={0.15}
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="received"
              name="Received"
              stroke="var(--color-navy)"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              name="Resolved and verified"
              stroke="var(--color-forest)"
              strokeWidth={3.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-6 font-body text-sm text-navy">
        <span className="flex items-center gap-2">
          <span className="w-8 border-t-2 border-dashed border-navy" />
          Received
        </span>
        <span className="flex items-center gap-2">
          <span className="w-8 border-t-4 border-forest" />
          Resolved and verified
        </span>
      </div>
    </div>
  )
}

function WaitingLongest({ items }) {
  return (
    <aside className="flex flex-col rounded-panel bg-navy p-6">
      <h2 className="font-heading text-2xl font-extrabold text-mint">Waiting longest</h2>
      <p className="mt-2 font-body text-sm text-mint/70">
        Issues that have gone the longest without being resolved.
      </p>

      <div className="mt-4 flex flex-col">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between gap-3 border-t border-mint/15 py-4"
          >
            <div className="min-w-0">
              <p className="font-body text-base font-bold text-mint">{item.title}</p>
              <p className="font-body text-sm text-mint/70">
                {item.department}
                {item.reopened ? ' · reopened' : ''}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber px-3 py-1 font-body text-sm font-bold text-navy">
              {item.days} days
            </span>
          </div>
        ))}
      </div>

      <Link
        to="/admin/verify"
        className="mt-auto rounded-full bg-mint px-6 py-3.5 text-center font-body text-base font-bold text-navy transition-opacity hover:opacity-90"
      >
        Open verification queue
      </Link>
    </aside>
  )
}

// Admins only. Department accounts go to their own panel.
export default function Accountability() {
  return (
    <RequireRole role="admin">
      <AccountabilityPage />
    </RequireRole>
  )
}

function AccountabilityPage() {
  useDocumentTitle('Accountability')
  const [weeks, setWeeks] = useState(8)
  const { data, error, loading, retry } = useAsync(loadAccountability)

  const weekly = data ? data.weekly.slice(-weeks) : []

  return (
    <AdminLayout
      variant="admin"
      active="Accountability"
      note="Numbers on this screen are sample data for the mockup."
    >
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-extrabold text-navy">
              Accountability
            </h1>
            <p className="mt-1 font-body text-base text-muted">
              How fast and how reliably each department fixes what citizens report.
            </p>
          </div>

          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            aria-label="Period"
            className="rounded-full border border-navy bg-white px-5 py-3 font-body text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-forest"
          >
            {PERIODS.map((p) => (
              <option key={p.weeks} value={p.weeks}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-6">
            <LoadError
              message="We could not load the accountability figures. Please try again."
              onRetry={retry}
            />
          </div>
        )}

        {loading && (
          <p role="status" className="mt-6 font-body text-base text-navy">
            Loading the accountability figures.
          </p>
        )}

        {data && (
          <>
            <div className="mt-6 grid grid-cols-4 gap-4">
              <StatCard label="Reports received">{data.stats.received}</StatCard>
              <StatCard label="Resolved and verified" valueClass="text-brand">
                {data.stats.resolved}
              </StatCard>
              <StatCard label="Average time to resolve">
                {data.stats.avgDays}{' '}
                <span className="text-xl font-bold">days</span>
              </StatCard>
              <StatCard label="Reopened after closing" valueClass="text-amber">
                {data.stats.reopenedPercent}%
              </StatCard>
            </div>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_340px] items-stretch gap-6">
              <div className="rounded-panel bg-mint p-6">
                <DepartmentTable departments={data.departments} />
                <WeeklyChart weekly={weekly} />
              </div>
              <WaitingLongest items={data.waitingLongest} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}