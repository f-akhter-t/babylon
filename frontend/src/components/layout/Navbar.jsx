import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Logo from './Logo'
import Button from '../ui/Button'
import { getSession, logout } from '../../services/auth'

const citizenLinks = [
  { label: 'Map', to: '/map' },
  { label: 'Issue feed', to: '/feed' },
  { label: 'My reports', to: '/my-reports' },
]

const departmentLinks = [{ label: 'Department panel', to: '/department' }]

const adminLinks = [
  { label: 'Department panel', to: '/department' },
  { label: 'Verify resolutions', to: '/admin/verify' },
  { label: 'Accountability', to: '/admin/accountability' },
]

const linksByVariant = {
  admin: adminLinks,
  department: departmentLinks,
}

function initialsFor(name, fallback) {
  const letters = (name ?? '')
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return letters || fallback
}

export default function Navbar({
  variant = 'logged-out',
  showReport = true,
  unread = 0,
  initials = 'NR',
}) {
  const navigate = useNavigate()
  const [session, setSession] = useState(getSession)

  // A real login decides which navbar to show. Without a login, the page decides.
  const current = session?.role ?? variant
  const links = linksByVariant[current] ?? citizenLinks
  const canReport = current !== 'admin' && current !== 'department'

  function handleLogout() {
    logout()
    setSession(null)
    navigate('/')
  }

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
        {current === 'logged-out' && (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold text-white transition-colors hover:text-brand"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white/80 transition-colors hover:text-brand"
            >
              Sign up
            </Link>
          </>
        )}

        {canReport && showReport && (
          <Button to="/report" variant="brand">
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Report an issue
          </Button>
        )}

        {current === 'citizen' && (
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

        {current !== 'logged-out' && (
          <span
            title={session?.name}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
          >
            {session ? initialsFor(session.name, initials) : initials}
          </span>
        )}

        {session && (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  )
}