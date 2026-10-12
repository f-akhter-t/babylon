import { Link } from 'react-router-dom'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  status: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <rect x="4" y="14" width="4" height="6" rx="1" />
      <rect x="10" y="10" width="4" height="10" rx="1" />
      <rect x="16" y="5" width="4" height="15" rx="1" opacity=".45" />
    </svg>
  ),
  nearby: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...base} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  resolved: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...base} strokeWidth={2.4} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  reopened: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...base} aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
}

const STYLES = {
  status: 'bg-slate text-mint',
  nearby: 'bg-amber text-navy',
  resolved: 'bg-forest text-mint',
  reopened: 'bg-amber text-navy',
}

function getType(alert) {
  if (ICONS[alert.type]) return alert.type
  if (alert.group === 'nearby') return 'nearby'
  if (alert.group === 'reopened') return 'reopened'
  if (/resolved|verified/i.test(alert.title ?? '')) return 'resolved'
  return 'status'
}

export default function AlertRow({ alert }) {
  const type = getType(alert)
  const clickable = Boolean(alert.issueId)

  const className =
    'group flex items-center gap-4 rounded-card bg-mint px-5 py-4 transition-all duration-200 ' +
    (clickable
      ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-mint-deep/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40'
      : 'hover:shadow-md')

  const content = (
    <>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${STYLES[type]}`}
      >
        {ICONS[type]}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-body text-[15px] font-bold text-navy">{alert.title}</p>
        <p className="font-body text-sm text-navy/75">{alert.message}</p>
      </div>

      {type === 'nearby' && clickable ? (
        <span className="shrink-0 rounded-full border border-navy px-5 py-2 font-body text-sm font-semibold text-navy transition-colors duration-200 group-hover:bg-navy group-hover:text-mint">
          View
        </span>
      ) : (
        <span className="shrink-0 font-body text-xs font-semibold text-navy/80">
          {alert.time}
        </span>
      )}
    </>
  )

  return clickable ? (
    <Link to={`/issues/${alert.issueId}`} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}