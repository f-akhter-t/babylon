import clsx from 'clsx'
import { Link } from 'react-router-dom'

const variants = {
  department: {
    label: 'Department panel',
    note: 'Only the admin can close an issue, after checking your after-photo.',
    items: [
      { label: 'Assigned issues' },
      { label: 'In progress' },
      { label: 'Awaiting verification' },
      { label: 'Completed' },
    ],
  },
  admin: {
    label: 'Admin oversight',
    note: 'Nothing closes without a photo you have checked.',
    items: [
      { label: 'Verification queue', to: '/admin/verify', count: 3 },
      { label: 'Reopened issues', to: '/admin/verify', count: 1, tone: 'amber' },
      { label: 'Accountability', to: '/admin/accountability' },
      { label: 'All issues' },
    ],
  },
}

function NavItem({ item, isActive, onSelect }) {
  const classes = clsx(
    'flex w-full items-center justify-between rounded-tile px-4 py-3',
    'font-body text-base font-semibold transition-colors text-left',
    isActive ? 'bg-mint text-navy' : 'text-mint/80 hover:bg-mint/10',
  )

  const badge = item.count ? (
    <span
      className={clsx(
        'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-bold',
        item.tone === 'amber' ? 'bg-amber text-navy' : 'bg-slate text-mint',
      )}
    >
      {item.count}
    </span>
  ) : null

  if (item.to) {
    return (
      <Link to={item.to} className={classes}>
        {item.label}
        {badge}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => onSelect?.(item.label)} className={classes}>
      {item.label}
      {badge}
    </button>
  )
}

export default function AdminLayout({
  variant = 'admin',
  active,
  onSelect,
  department = 'Roads & Highways',
  note,
  children,
}) {
  const config = variants[variant]

  return (
    <div className="flex min-h-screen bg-page font-body">
      <aside className="flex w-[250px] shrink-0 flex-col bg-navy px-3.5 py-6">
        <div className="px-2">
          <p className="font-heading text-3xl font-extrabold text-mint">Babylon</p>
          <p className="mt-1 font-body text-xs font-bold uppercase tracking-widest text-brand">
            {config.label}
          </p>
        </div>

        {variant === 'department' && (
          <div className="mt-6 rounded-tile border border-mint/15 bg-mint/5 px-4 py-3">
            <p className="text-xs text-mint/70">Signed in as</p>
            <p className="font-heading text-base font-bold text-mint">{department}</p>
          </div>
        )}

        <nav className="mt-6 flex flex-col gap-2">
          {config.items.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={item.label === active}
              onSelect={onSelect}
            />
          ))}
        </nav>

        <p className="mt-auto px-2 text-sm text-mint/70">{note ?? config.note}</p>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}