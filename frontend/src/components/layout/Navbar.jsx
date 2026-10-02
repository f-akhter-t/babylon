import { useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const links = variant === 'admin' ? adminLinks : citizenLinks

  const navLinks = links.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        clsx(
          'flex h-11 items-center rounded-full px-5 text-base font-semibold transition-colors',
          isActive ? 'bg-mint text-navy' : 'text-page hover:text-white',
        )
      }
    >
      {link.label}
    </NavLink>
  ))

  const actions = (
    <>
      {variant === 'logged-out' && (
        <button
          type="button"
          className="flex h-11 items-center px-4.5 text-base font-bold text-mint hover:text-brand"
        >
          Log in
        </button>
      )}

      {variant !== 'admin' && showReport && (
        <Button to="/report" variant="brand" size="nav">
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
    </>
  )

  return (
    <header className="sticky top-0 z-[1100] border-b border-slate bg-navy font-body">
      <div className="flex h-17 items-center gap-10 px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-1.5 lg:flex">{navLinks}</nav>

        <div className="ml-auto hidden items-center gap-4 lg:flex">{actions}</div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto flex size-11 items-center justify-center rounded-full border border-slate text-mint lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-slate px-5 pb-5 pt-3 md:px-8 lg:hidden">
          <nav className="flex flex-col gap-1">{navLinks}</nav>
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        </div>
      )}
    </header>
  )
}