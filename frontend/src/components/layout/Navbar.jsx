import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Logo from './Logo'
import Button from '../ui/Button'

const citizenLinks = [
  { label: 'Map', to: '/map' },
  { label: 'Issue feed', to: '/feed' },
  { label: 'My reports', to: '/my-reports' },
]

const adminLinks = [
  { label: 'Department panel', to: '/department' },
  { label: 'Verify resolutions', to: '/admin/verify' },
  { label: 'Accountability', to: '/admin/accountability' },
]

export default function Navbar({
  variant = 'logged-out',
  showReport = true,
  unread = 0,
  initials = 'NR',
}) {
  const links = variant === 'admin' ? adminLinks : citizenLinks

  return (
    <header className="flex items-center gap-8 border-b border-white/10 bg-navy px-10 py-3 font-body">
      <Logo />

      <nav className="flex items-center gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              clsx(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-mint text-navy' : 'text-white/80 hover:text-white',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        {variant === 'logged-out' && (
          <button
            type="button"
            className="text-sm font-semibold text-white hover:text-brand"
          >
            Log in
          </button>
        )}

        {variant !== 'admin' && showReport && (
          <Button to="/report" variant="brand">
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Report an issue
          </Button>
        )}

        {variant === 'citizen' && (
          <Link
            to="/my-reports"
            aria-label={`Alerts, ${unread} new`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber text-xs font-bold text-navy">
                {unread}
              </span>
            )}
          </Link>
        )}

        {variant !== 'logged-out' && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
            {initials}
          </span>
        )}
      </div>
    </header>
  )
}