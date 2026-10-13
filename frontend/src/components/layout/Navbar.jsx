import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import Button from '../ui/Button'
import { getSession, homePathFor, logout } from '../../services/auth'
import { useProfile } from '../../hooks/useProfile'
import { confirmLeave } from '../../utils/leaveGuard'

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

// Staff avatars open their own panel. The path comes from homePathFor, like the login redirect.
const staffAvatarLabels = {
  department: 'Open your department panel',
  admin: 'Open the admin panel',
}

function initialsFor(name, fallback) {
  const letters = (name ?? '')
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return letters || fallback
}


// With `to`, the avatar is a link (citizens: their profile, staff: their panel).
// `label` is the link's accessible name. `verified` adds a small check on the corner.
function Avatar({ name, text, to, label, verified }) {
  const circle =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white'
  const check = verified && (
    <span
      aria-hidden="true"
      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-navy ring-2 ring-navy"
    >
      <svg
        viewBox="0 0 24 24"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  )

  if (to) {
    return (
      <Link
        to={to}
        title={name}
        aria-label={label}
        className={clsx(circle, 'relative transition hover:ring-2 hover:ring-brand')}
      >
        {text}
        {check}
      </Link>
    )
  }

  return (
    <span title={name} className={circle}>
      {text}
    </span>
  )
}

export default function Navbar({
  variant = 'logged-out',
  showReport = true,
  initials = 'NR',
}) {
  const navigate = useNavigate()
  const [session, setSession] = useState(getSession)
  const [open, setOpen] = useState(false)

  // A real login decides which navbar to show. Without a login, the page decides.
  const current = session?.role ?? variant
  const links = linksByVariant[current] ?? citizenLinks
  const canReport = current !== 'admin' && current !== 'department'
  // Citizens: name and Verified status from their profile, so a rename shows at once.
  const profile = useProfile()
  const isCitizen = session?.role === 'citizen'
  const displayName = isCitizen ? profile.name || session.name : session?.name
  const avatarText = session ? initialsFor(displayName, initials) : initials
  // The avatar link follows the real login, never the page's variant, so guests get none.
  const staffLabel = staffAvatarLabels[session?.role]
  let avatarTo
  let avatarLabel
  if (isCitizen) {
    avatarTo = '/profile'
    avatarLabel = profile.isVerified ? 'Your profile, verified' : 'Your profile'
  } else if (staffLabel) {
    avatarTo = homePathFor(session.role)
    avatarLabel = staffLabel
  }

  function handleLogout() {
    if (!confirmLeave()) return // unsaved changes on this page: stay
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

          {current === 'citizen' && <NotificationBell email={session?.email} />}

          {current !== 'logged-out' && (
            <Avatar
              name={displayName}
              text={avatarText}
              to={avatarTo}
              label={avatarLabel}
              verified={isCitizen && profile.isVerified}
            />
          )}

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
          {isCitizen && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between gap-3 rounded-tile px-4 py-3 transition-colors',
                  isActive ? 'bg-mint text-navy' : 'text-white hover:bg-white/10',
                )
              }
            >
              <span className="min-w-0">
                <span className="block text-xs opacity-70">Your profile</span>
                <span className="block truncate text-base font-semibold">{displayName}</span>
              </span>
              {profile.isVerified && (
                <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-navy">
                  Verified
                </span>
              )}
            </NavLink>
          )}

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