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
import { fit, REGION_FOCUS, useFitMode } from '../../components/layout/staffFit'

const PERIODS = [
  { label: 'Last 4 weeks', weeks: 4 },
  { label: 'Last 8 weeks', weeks: 8 },
]

function StatCard({ label, children, valueClass }) {
  return (
    <div className="min-w-0 rounded-card bg-navy px-5 py-4 xl:px-6 xl:py-5">
      <p className="font-body text-sm font-bold text-mint">{label}</p>
      <p
        className={clsx(
          'mt-2 font-heading text-4xl font-extrabold sm:text-5xl lg:text-4xl xl:text-5xl',
          valueClass ?? 'text-mint',
        )}
      >
        {children}
      </p>
    </div>
  )
}

// A table where it is at least 36rem wide; one labelled card per department
// when narrower. Container queries, so it follows its own width.
function DepartmentTable({ departments }) {
  const columns = '@xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_70px_80px]'
  const cardLabel = 'block font-body text-sm font-semibold text-muted @xl:hidden'

  return (
    <div className="@container">
      <h2 className="font-heading text-2xl font-extrabold text-navy">
        Department performance
      </h2>

      <div
        className={clsx(
          'mt-4 hidden gap-4 font-body text-sm font-semibold text-muted @xl:grid',
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
              'mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-navy/10 py-4 @xl:items-center @xl:gap-4',
              'font-body text-base font-bold text-navy',
              columns,
            )}
          >
            <span className="col-span-2 min-w-0 break-words @xl:col-span-1">{d.name}</span>
            <div className="col-span-2 flex min-w-0 items-center gap-3 @xl:col-span-1">
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
            <span>
              <span className={cardLabel}>Avg days</span>
              {d.avgDays}
            </span>
            <span>
              <span className={cardLabel}>Reopened</span>
              {d.reopened}
            </span>
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
              interval="preserveStartEnd"
              minTickGap={12}
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

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-sm text-navy">
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

// In fit mode the list scrolls and the link to the queue stays at the bottom.
function WaitingLongest({ items, fitMode }) {
  return (
    <aside className={clsx('flex flex-col rounded-panel bg-navy p-4 sm:p-6', fit.column)}>
      <h2 className="font-heading text-2xl font-extrabold text-mint">Waiting longest</h2>
      <p className="mt-2 font-body text-sm text-mint/70">
        Issues that have gone the longest without being resolved.
      </p>

      <div
        role={fitMode ? 'region' : undefined}
        aria-label={fitMode ? 'Waiting longest' : undefined}
        tabIndex={fitMode ? 0 : undefined}
        className={clsx(
          'mt-4 flex flex-col rounded-tile',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
          fit.scroll,
          fit.grow,
          fit.min32,
        )}
      >
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between gap-3 border-t border-mint/15 py-4"
          >
            <div className="min-w-0">
              <p className="break-words font-body text-base font-bold text-mint">{item.title}</p>
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
        className="mt-4 flex min-h-11 shrink-0 items-center justify-center rounded-full bg-mint px-6 py-3 text-center font-body text-base font-bold text-navy transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none"
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
  const fitMode = useFitMode()

  const weekly = data ? data.weekly.slice(-weeks) : []

  return (
    <AdminLayout
      variant="admin"
      active="Accountability"
      note="Numbers on this screen are sample data for the mockup."
    >
      <div className={clsx('p-4 sm:p-6 lg:p-8', fit.page)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
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
            className="min-h-11 w-full rounded-full border border-navy bg-white px-5 py-2 font-body text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-forest sm:w-auto"
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
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            {/* Below lg everything stacks: table, chart, then Waiting longest. */}
            <div
              className={clsx(
                'mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18.75rem]',
                fit.grow,
                fit.rows,
                fit.min64,
              )}
            >
              <div
                role={fitMode ? 'region' : undefined}
                aria-label={fitMode ? 'Department performance and reports per week' : undefined}
                tabIndex={fitMode ? 0 : undefined}
                className={clsx('min-w-0 rounded-panel bg-mint p-4 sm:p-6', fit.scroll, REGION_FOCUS)}
              >
                <DepartmentTable departments={data.departments} />
                <WeeklyChart weekly={weekly} />
              </div>
              <WaitingLongest items={data.waitingLongest} fitMode={fitMode} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
