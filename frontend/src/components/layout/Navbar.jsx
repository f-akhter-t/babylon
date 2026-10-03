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

function BellLink({ unread }) {
  return (
    <Link
      to="/my-reports"
      aria-label={`Alerts, ${unread} new`}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
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
  )
}

function Avatar({ name, text }) {
  return (
    <span
      title={name}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white"
    >
      {text}
    </span>
  )
}

export default function Navbar({
  variant = 'logged-out',
  showReport = true,
  unread = 0,
  initials = 'NR',
}) {
  const navigate = useNavigate()
  const [session, setSession] = useState(getSession)
  const [open, setOpen] = useState(false)

  // A real login decides which navbar to show. Without a login, the page decides.
  const current = session?.role ?? variant
  const links = linksByVariant[current] ?? citizenLinks
  const canReport = current !== 'admin' && current !== 'department'
  const avatarText = session ? initialsFor(session.name, initials) : initials

  function handleLogout() {
    logout()
    setSession(null)
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-[1100] border-b border-white/10 bg-navy font-body">
      <div className="flex items-center gap-4 px-5 py-3 lg:gap-8 lg:px-10">
        <div className="shrink-0">
          <Logo />
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-mint text-navy' : 'text-white/80 hover:text-white',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:gap-4">
          {current === 'logged-out' && (
            <div className="hidden items-center gap-4 lg:flex">
              <Link
                to="/login"
                className="whitespace-nowrap text-sm font-semibold text-white transition-colors hover:text-brand"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="whitespace-nowrap text-sm font-semibold text-white/80 transition-colors hover:text-brand"
              >
                Sign up
              </Link>
            </div>
          )}

          {canReport && showReport && (
            <div className="hidden whitespace-nowrap lg:block">
              <Button to="/report" variant="brand">
                <span aria-hidden="true" className="text-lg leading-none">+</span>
                Report an issue
              </Button>
            </div>
          )}

          {current === 'citizen' && <BellLink unread={unread} />}

          {current !== 'logged-out' && <Avatar name={session?.name} text={avatarText} />}

          {session && (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden whitespace-nowrap rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 lg:block"
            >
              Log out
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          onClick={(event) => {
            if (event.target.closest('a')) setOpen(false)
          }}
          className="flex flex-col gap-1 border-t border-white/10 px-5 pb-5 pt-3 lg:hidden"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-tile px-4 py-3 text-base font-medium transition-colors',
                  isActive ? 'bg-mint text-navy' : 'text-white/80 hover:bg-white/10',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          {current === 'logged-out' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="rounded-full border border-white/20 px-4 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-white/20 px-4 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign up
              </Link>
            </div>
          )}

          {canReport && showReport && (
            <div className="mt-2 [&>*]:w-full [&>*]:justify-center">
              <Button to="/report" variant="brand">
                <span aria-hidden="true" className="text-lg leading-none">+</span>
                Report an issue
              </Button>
            </div>
          )}

          {session && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-full border border-white/20 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </header>
  )
}