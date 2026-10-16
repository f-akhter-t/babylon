import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import Button from '../ui/Button'
import { homePathFor, isOnboarded, logout, profilePathFor } from '../../services/auth'
import { useViewer } from '../../pages/Map/useViewer'
import { useProfile } from '../../hooks/useProfile'
import { usePendingIdentityCount } from '../../hooks/usePendingIdentityCount'
import { confirmLeave } from '../../utils/leaveGuard'
import { enter, usePresence } from '../ui/motion'

const citizenLinks = [
  { label: 'Map', to: '/map' },
  { label: 'Issue feed', to: '/feed' },
  { label: 'My reports', to: '/my-reports' },
]

const departmentLinks = [{ label: 'Department panel', to: '/department' }]

const adminLinks = [
  { label: 'Verify resolutions', to: '/admin/verify' },
  { label: 'Accountability', to: '/admin/accountability' },
  { label: 'Identity checks', to: '/admin/identity', count: 'identity' },
]

// "Identity checks" with the number waiting. Only rendered in admin links,
// so only admins run the count.
function IdentityChecksLabel({ label }) {
  const waiting = usePendingIdentityCount()
  if (!waiting) return label
  return (
    <>
      <span className="sr-only">{`${label}, ${waiting} waiting`}</span>
      <span aria-hidden="true">
        {label}
        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-xs font-bold text-navy">
          {waiting}
        </span>
      </span>
    </>
  )
}

function linkLabel(link) {
  return link.count === 'identity' ? <IdentityChecksLabel label={link.label} /> : link.label
}

const linksByVariant = {
  admin: adminLinks,
  department: departmentLinks,
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


// With `to`, the avatar is a link to the account's own profile page.
// `label` is the link's accessible name. `verified` adds a small check on the corner.
// `photo` (staff) shows instead of the initials; the initials stay in the name.
function Avatar({ name, text, to, label, verified, photo }) {
  const circle =
    'flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white max-lg:size-11'
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
        // The visible initials are part of the name, so voice control can use them.
        aria-label={`${label}, ${text}`}
        className={clsx(circle, 'relative transition hover:ring-2 hover:ring-brand')}
      >
        {photo ? (
          <img src={photo} alt="" className="size-full rounded-full object-cover" />
        ) : (
          text
        )}
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
  showReport = true,
  initials = 'NR',
}) {
  const navigate = useNavigate()
  // The live session (it follows a login or logout in another tab). The
  // whole bar, the avatar included, comes from it: pages pass nothing.
  const { session } = useViewer()
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)
  const menuButtonRef = useRef(null)
  const location = useLocation()

  // The phone menu closes when the page changes (a link, Back, a redirect).
  const [shownAt, setShownAt] = useState(location.key)
  if (shownAt !== location.key) {
    setShownAt(location.key)
    setOpen(false)
  }

  // While it is open: Escape closes it and puts focus back on the Menu
  // button; a click or tap outside the header closes it.
  useEffect(() => {
    if (!open) return
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButtonRef.current?.focus()
    }
    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // The menu fades out after closing; it is inert from the moment it closes.
  const menu = usePresence(open)

  const current = session?.role ?? 'logged-out'
  // A staff account still setting up its profile: only the avatar (to that
  // profile) and Log out are offered. The gate keeps it off these pages
  // anyway; this is a backstop so nothing here ever leads to a redirect.
  const locked = Boolean(session) && !isOnboarded(session.email)
  const links = locked ? [] : (linksByVariant[current] ?? citizenLinks)
  const canReport = current !== 'admin' && current !== 'department' && !locked
  // Name, photo and Verified status from the profile, so a change shows at once.
  const profile = useProfile()
  const isCitizen = session?.role === 'citizen'
  const displayName = session ? profile.name || session.name : ''
  const avatarText = session ? initialsFor(displayName, initials) : initials
  // Every account's avatar opens its own profile page. Guests have no avatar.
  const profilePath = session ? profilePathFor(session.role) : null
  const avatarLabel = isCitizen && profile.isVerified ? 'Your profile, verified' : 'Your profile'
  const avatarPhoto = !isCitizen ? profile.profile?.photo : ''

  function handleLogout() {
    // Unsaved changes on this page: ask first. Not while a staff account is
    // setting up its profile, where Log out must never be held up.
    if (!locked && !confirmLeave()) return
    logout()
    // Tell every live reader of the session in this tab (this bar, the footer,
    // the page guards) the same way another tab's logout would.
    window.dispatchEvent(new StorageEvent('storage', { key: 'babylon-session' }))
    setOpen(false)
    navigate('/')
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-[1100] border-b border-white/10 bg-navy font-body">
      <div className="flex flex-wrap items-center gap-4 px-5 py-3 lg:gap-8 lg:px-10">
        <div className="shrink-0">
          <Logo {...(locked ? { to: null } : {})} />
        </div>

        <nav aria-label="Main" className="hidden items-center gap-2 lg:flex">
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
              {linkLabel(link)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-3 lg:gap-4">
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

          {/* Every signed-in account has a bell; staff get a link to their panel in it. */}
          {session && !locked && (
            <NotificationBell
              email={session.email}
              {...(isCitizen ? {} : { homeLink: homePathFor(session.role), homeLabel: 'Open your panel' })}
            />
          )}

          {current !== 'logged-out' && (
            <Avatar
              name={displayName}
              text={avatarText}
              to={profilePath}
              label={avatarLabel}
              verified={isCitizen && profile.isVerified}
              photo={avatarPhoto}
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
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
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

      {menu.mounted && (
        <div
          id="mobile-menu"
          inert={menu.closing}
          aria-hidden={menu.closing || undefined}
          onClick={(event) => {
            if (event.target.closest('a')) setOpen(false)
          }}
          style={
            menu.closing
              ? enter('fade-out', 0, 'var(--duration-fast)')
              : enter('rise-in', 0, 'var(--duration-base)')
          }
          className={clsx(
            'flex flex-col gap-1 border-t border-white/10 px-5 pb-5 pt-3 lg:hidden',
            menu.closing && 'pointer-events-none',
          )}
        >
          <nav aria-label="Main" className="flex flex-col gap-1">
            {session && (
              <NavLink
                to={profilePath}
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
                {isCitizen && profile.isVerified && (
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
                {linkLabel(link)}
              </NavLink>
            ))}
          </nav>

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