import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import CountUp from '../../components/ui/CountUp'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { useAsync } from '../../hooks/useAsync'
import {
  getAdminCounts,
  getIdentityQueueCount,
  loadAccountability,
  loadDepartmentPanel,
} from '../../services/api'
import { useNumber, useT } from '../../i18n/useLanguage'

// The overview at the top of a staff profile. Department: its own issues.
// Admin: the queues and the last eight weeks across all departments.

const PRIORITY_ORDER = ['urgent', 'high', 'medium']
const PRIORITY_LABEL = {
  urgent: 'Urgent priority',
  high: 'High priority',
  medium: 'Medium priority',
}
const PRIORITY_BAR = { urgent: 'bg-flag-red', high: 'bg-amber', medium: 'bg-brand' }

function Tile({ label, value, hint, tone = 'text-mint', delay = 0 }) {
  return (
    <div
      className="lift rounded-tile bg-white/[0.07] px-5 py-5 ring-1 ring-white/10 backdrop-blur-sm motion-safe:animate-[rise-in_0.5s_var(--ease-calm)_both]"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="font-body text-sm font-semibold uppercase tracking-wider text-mint/70">{label}</p>
      <p className={clsx('mt-3 font-heading text-5xl font-extrabold leading-none sm:text-6xl', tone)}>
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </p>
      {hint && <p className="mt-3 font-body text-sm text-mint/65">{hint}</p>}
    </div>
  )
}

// A ring that fills to `percent` once it appears.
function Ring({ percent, label, caption }) {
  const num = useNumber()
  const [drawn, setDrawn] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(percent))
    return () => cancelAnimationFrame(frame)
  }, [percent])
  const radius = 42
  const length = 2 * Math.PI * radius
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="relative size-32 shrink-0 sm:size-40">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="9" className="text-mint" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-flag-green-light)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - drawn / 100)}
            style={{ transition: 'stroke-dashoffset 1.2s var(--ease-calm)' }}
          />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-extrabold text-mint sm:text-4xl">
          {num(percent)}%
        </p>
      </div>
      <div className="min-w-[9rem] flex-1">
        <p className="font-body text-base font-bold text-mint">{label}</p>
        <p className="mt-1 font-body text-sm text-mint/65">{caption}</p>
      </div>
    </div>
  )
}

// Received (dashed) and resolved (solid) per week, as a small line chart.
function Sparkline({ weekly }) {
  const t = useT()
  if (!weekly || weekly.length < 2) return null
  const width = 240
  const height = 120
  const max = Math.max(1, ...weekly.flatMap((w) => [w.received, w.resolved]))
  const x = (i) => (i / (weekly.length - 1)) * width
  const y = (v) => height - 6 - (v / max) * (height - 14)
  const line = (key) => weekly.map((w, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(w[key]).toFixed(1)}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label={t('Reports received and resolved each week')}>
        <path d={`${line('resolved')} L${width} ${height} L0 ${height} Z`} fill="var(--color-flag-green-light)" fillOpacity="0.15" />
        <path d={line('received')} fill="none" stroke="var(--color-mint)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
        <path d={line('resolved')} fill="none" stroke="var(--color-flag-green-light)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-mint/70">
        <span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-mint/70" />{t('Received')}</span>
        <span className="flex items-center gap-1.5"><span className="w-5 border-t-[3px] border-flag-green-light" />{t('Resolved and verified')}</span>
      </div>
    </div>
  )
}

function Panel({ title, children, className }) {
  return (
    <div className={clsx('rounded-tile bg-white/[0.06] p-5 ring-1 ring-white/10 sm:p-6', className)}>
      <h3 className="mb-4 font-body text-base font-bold text-mint">{title}</h3>
      {children}
    </div>
  )
}

function ActionLink({ to, children, primary }) {
  return (
    <Link
      to={to}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 font-body text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
        primary ? 'bg-mint text-navy' : 'border-2 border-mint/40 text-mint',
      )}
    >
      {children}
    </Link>
  )
}

function Shell({ title, subtitle, children, actions }) {
  return (
    <section
      aria-labelledby="staff-overview-heading"
      className="relative mt-6 overflow-hidden rounded-panel bg-gradient-to-br from-navy via-navy to-slate p-6 text-mint shadow-lg sm:p-8 lg:p-10"
    >
      <StaircaseIcon level={3} className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 text-brand opacity-[0.08]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="staff-overview-heading" className="font-heading text-3xl font-extrabold sm:text-4xl">{title}</h2>
          <p className="mt-1 font-body text-base text-mint/70">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <div className="relative mt-7">{children}</div>
    </section>
  )
}

function Failed({ onRetry }) {
  const t = useT()
  return (
    <p role="alert" className="font-body text-sm text-mint">
      {t('We could not load the overview.')}{' '}
      <button type="button" onClick={onRetry} className="font-bold underline">{t('Try again')}</button>
    </p>
  )
}

function Loading() {
  const t = useT()
  return (
    <div role="status" className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr))]">
      <span className="sr-only">{t('Loading the overview…')}</span>
      {[0, 1, 2, 3].map((n) => (
        <div key={n} aria-hidden="true" className="h-24 rounded-tile bg-white/10 skeleton" />
      ))}
    </div>
  )
}

function DepartmentOverview({ department }) {
  const t = useT()
  const num = useNumber()
  const load = useCallback(() => loadDepartmentPanel(department), [department])
  const { data, error, loading, retry } = useAsync(load)

  const actions = (
    <>
      <ActionLink to="/department" primary>{t('Open department panel')}</ActionLink>
      <ActionLink to="/department?status=awaiting">{t('Awaiting verification')}</ActionLink>
    </>
  )
  const title = t('Your department at a glance')
  const subtitle = department ? t('{department} · live numbers', { department: t(department) }) : ''

  if (loading || error || !data) {
    return (
      <Shell title={title} subtitle={subtitle} actions={actions}>
        {error ? <Failed onRetry={retry} /> : <Loading />}
      </Shell>
    )
  }

  const assigned = data.assigned
  const open = assigned.filter((i) => i.status === 'open').length
  const awaiting = assigned.filter((i) => i.verification === 'awaiting').length
  const inProgress = assigned.filter((i) => i.status === 'in-progress' && i.verification !== 'awaiting').length
  const completed = data.completed.length
  const total = assigned.length + completed
  const percent = total ? Math.round((completed / total) * 100) : 0
  const byPriority = PRIORITY_ORDER.map((key) => ({
    key,
    count: assigned.filter((i) => i.priority === key && i.status !== 'resolved').length,
  }))
  const topPriority = Math.max(1, ...byPriority.map((p) => p.count))
  const next = assigned
    .filter((i) => i.status === 'open')
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority))
    .slice(0, 3)

  return (
    <Shell title={title} subtitle={subtitle} actions={actions}>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr))]">
        <Tile label={t('Open')} value={open} hint={t('Waiting for work to start')} tone="text-amber" delay={0} />
        <Tile label={t('In progress')} value={inProgress} hint={t('Being fixed now')} delay={0.06} />
        <Tile label={t('Awaiting verification')} value={awaiting} hint={t('With the admin')} delay={0.12} />
        <Tile label={t('Completed')} value={completed} hint={t('Closed and verified')} tone="text-flag-green-light" delay={0.18} />
      </div>

      <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <Panel title={t('Completion rate')}>
          <Ring
            percent={percent}
            label={t('{done} of {total} issues closed', { done: completed, total })}
            caption={t('Across all issues sent to your department')}
          />
        </Panel>
        <Panel title={t('Still to do, by priority')}>
          <ul className="flex flex-col gap-4">
            {byPriority.map((p) => (
              <li key={p.key}>
                <div className="flex justify-between font-body text-sm text-mint/80">
                  <span>{t(PRIORITY_LABEL[p.key])}</span>
                  <span className="font-bold text-mint">{num(p.count)}</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={clsx('h-full rounded-full transition-[width] duration-1000', PRIORITY_BAR[p.key])}
                    style={{ width: `${(p.count / topPriority) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t('Next up')}>
          {next.length ? (
            <ul className="flex flex-col gap-2">
              {next.map((issue) => (
                <li key={issue.id} className="flex items-start gap-3 font-body text-base">
                  <span aria-hidden="true" className={clsx('mt-1.5 size-2 shrink-0 rounded-full', PRIORITY_BAR[issue.priority] ?? 'bg-brand')} />
                  <span className="min-w-0 break-words text-mint">{issue.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-sm text-mint/70">{t('Nothing is waiting to start. Well done.')}</p>
          )}
        </Panel>
      </div>
    </Shell>
  )
}

function AdminOverview() {
  const t = useT()
  const num = useNumber()
  const load = useCallback(async () => {
    const [counts, identity, figures] = await Promise.all([
      getAdminCounts(),
      getIdentityQueueCount(),
      loadAccountability(8),
    ])
    return { counts, identity, figures }
  }, [])
  const { data, error, loading, retry } = useAsync(load)

  const actions = (
    <>
      <ActionLink to="/admin/verify" primary>{t('Open verification queue')}</ActionLink>
      <ActionLink to="/admin/accountability">{t('Accountability')}</ActionLink>
    </>
  )
  const title = t('Platform at a glance')
  const subtitle = t('Queues now, and the last 8 weeks across every department')

  if (loading || error || !data) {
    return (
      <Shell title={title} subtitle={subtitle} actions={actions}>
        {error ? <Failed onRetry={retry} /> : <Loading />}
      </Shell>
    )
  }

  const { counts, identity, figures } = data
  const { stats, departments, weekly } = figures
  const percent = stats.received ? Math.min(100, Math.round((stats.resolved / stats.received) * 100)) : 0
  const ranked = [...departments]
    .map((d) => ({ ...d, share: d.assigned ? d.resolved / d.assigned : 0 }))
    .sort((a, b) => b.share - a.share)

  return (
    <Shell title={title} subtitle={subtitle} actions={actions}>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr))]">
        <Tile label={t('Fixes to check')} value={counts.queue} hint={t('Waiting for your decision')} tone="text-amber" delay={0} />
        <Tile label={t('Reopened issues')} value={counts.reopened} hint={t('A closed problem came back')} delay={0.06} />
        <Tile label={t('Identity checks')} value={identity} hint={t('Citizens waiting for a badge')} delay={0.12} />
        <Tile
          label={t('Average days to resolve')}
          value={
            <>
              {num(Number(stats.avgDays.toFixed(1)))}
              <span className="ml-1 font-body text-base font-bold text-mint/70">{t('days')}</span>
            </>
          }
          hint={t('Last 8 weeks')}
          tone="text-flag-green-light"
          delay={0.18}
        />
      </div>

      <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <Panel title={t('Resolution rate')}>
          <Ring
            percent={percent}
            label={t('{done} of {total} reports resolved', { done: stats.resolved, total: stats.received })}
            caption={t('Resolved and verified, last 8 weeks')}
          />
        </Panel>
        <Panel title={t('Week by week')}>
          <Sparkline weekly={weekly} />
        </Panel>
        <Panel title={t('Departments, best first')}>
          <ul className="flex flex-col gap-4">
            {ranked.map((d) => (
              <li key={d.name}>
                <div className="flex justify-between gap-2 font-body text-sm text-mint/80">
                  <span className="min-w-0 truncate">{t(d.name)}</span>
                  <span className="shrink-0 font-bold text-mint">{num(Math.round(d.share * 100))}%</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-flag-green-light transition-[width] duration-1000" style={{ width: `${d.share * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  )
}

export default function StaffDashboard({ role, department }) {
  return role === 'admin' ? <AdminOverview /> : <DepartmentOverview department={department} />
}
