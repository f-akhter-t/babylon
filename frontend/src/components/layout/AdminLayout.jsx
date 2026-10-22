import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { useAdminCounts } from '../../hooks/useAdminCounts'
import { ADMIN_NAV } from './adminNav'
import AdminSignOut from './AdminSignOut'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import { useViewer } from '../../pages/Map/useViewer'
import { homePathFor, isOnboarded } from '../../services/auth'
import { fit } from './staffFit'

const LG_QUERY = '(min-width: 64rem)'
const MENU_ID = 'staff-menu'
// The top bar sticks below lg, but only when the window is tall enough: on a
// short or zoomed window it would take too much of the screen. Keep in step
// with the max-lg:[@media(min-height:30rem)]:sticky class below.
const TOP_BAR_STICKY_QUERY = '(max-width: 63.999rem) and (min-height: 30rem)'

// A link in the drawer may open another staff page, which mounts a new layout.
// The time of that click tells the new layout to put focus on its Menu button.
let drawerLinkAt = 0
const justUsedDrawerLink = () => Date.now() - drawerLinkAt < 1500

// The logo takes staff to their own panel.
const LOGO_LABELS = {
  department: 'Babylon, go to your department panel',
  admin: 'Babylon, go to the admin panel',
}

function NavItem({ item, isActive, onSelect, onNavigate }) {
  const classes = clsx(
    'flex min-h-11 w-full items-center justify-between rounded-tile px-4 py-3',
    'font-body text-base font-semibold transition-colors text-left motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
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
      <Link
        to={item.to}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
        className={classes}
      >
        {item.label}
        {badge}
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => {
        onSelect?.(item.label)
        onNavigate?.()
      }}
      className={classes}
    >
      {item.label}
      {badge}
    </button>
  )
}

// Everything in the sidebar: used by the desktop sidebar and the drawer.
// bell: the notification bell, shown beside the logo (desktop sidebar only).
// locked: the account has not finished its profile, so only Profile and
// Log out are offered (the logo is not a link and there is no bell).
function StaffNav({ variant, active, onSelect, department, note, counts, onNavigate, bell, locked }) {
  const config = ADMIN_NAV[variant]
  const items = locked ? config.items.filter((item) => item.label === 'Profile') : config.items

  return (
    <>
      <div className="px-2">
        <div className="flex items-center justify-between gap-2">
          <Logo
            size="lg"
            to={locked ? null : homePathFor(variant)}
            label={locked ? undefined : LOGO_LABELS[variant]}
            onClick={onNavigate}
          />
          {!locked && bell}
        </div>
        <p className="mt-1 font-body text-xs font-bold uppercase tracking-widest text-brand">
          {config.label}
        </p>
      </div>

      {variant === 'department' && department && (
        <div className="mt-6 rounded-tile border border-mint/15 bg-mint/5 px-4 py-3">
          <p className="text-xs text-mint/70">Signed in as</p>
          <p className="font-heading text-base font-bold text-mint">{department}</p>
        </div>
      )}

      <nav aria-label={config.label} className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <NavItem
            key={item.label}
            item={item.badge ? { ...item, count: counts[item.badge] } : item}
            isActive={item.label === active}
            onSelect={onSelect}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <p className="mt-auto px-2 pt-6 text-sm text-mint/70">{note ?? config.note}</p>
      <AdminSignOut className="mt-4" />
    </>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

// Staff pages. From lg up: a fixed sidebar, and the page fits the window when
// it is tall enough (see staffFit.js). Below lg: a top bar whose Menu button
// opens the same sidebar as a drawer.
export default function AdminLayout({
  variant = 'admin',
  active,
  onSelect,
  department,
  note,
  children,
}) {
  const config = ADMIN_NAV[variant]
  const counts = useAdminCounts(variant, department)
  const { session } = useViewer()
  const locked = Boolean(session) && !isOnboarded(session.email)
  // The same bell as the citizen's, for this staff account; its last link opens the panel.
  const bell = session && !locked ? (
    <NotificationBell email={session.email} homeLink={homePathFor(variant)} homeLabel="Open your panel" />
  ) : null
  const location = useLocation()
  // The drawer belongs to the page it was opened on: moving to another page
  // (or another filter) closes it.
  const [openOn, setOpenOn] = useState(null)
  const menuOpen = openOn !== null && openOn === location.key
  const dialogRef = useRef(null)
  const menuButtonRef = useRef(null)
  const layoutRef = useRef(null)
  const topBarRef = useRef(null)

  // A drawer link moved to another staff page: focus its Menu button.
  useEffect(() => {
    if (!justUsedDrawerLink()) return
    drawerLinkAt = 0
    if (!window.matchMedia(LG_QUERY).matches) menuButtonRef.current?.focus()
  }, [])

  // Open and close the native dialog. While it is open, the page behind it
  // cannot be used or scrolled.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (menuOpen && !dialog.open) dialog.showModal()
    if (!menuOpen && dialog.open) dialog.close()
    if (!menuOpen) return
    const root = document.documentElement
    const before = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = before
    }
  }, [menuOpen])

  // When the page scrolls, the top bar (below lg) and the action bars stick to
  // the window. The scroll padding keeps a focused field from scrolling under
  // either one. --staff-bar is the top bar's height while it sticks (else 0),
  // for other sticky things such as the issue table's header. All of it is
  // removed when the staff layout goes, so citizen pages are not affected.
  useEffect(() => {
    const html = document.documentElement
    const layout = layoutRef.current
    const bar = topBarRef.current
    const sticky = window.matchMedia(TOP_BAR_STICKY_QUERY)
    const update = () => {
      const height = sticky.matches ? bar.offsetHeight : 0
      layout.style.setProperty('--staff-bar', `${height}px`)
      html.style.scrollPaddingTop = `${height}px`
    }
    html.style.scrollPaddingBottom = '7rem'
    update()
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    sticky.addEventListener('change', update)
    return () => {
      observer.disconnect()
      sticky.removeEventListener('change', update)
      layout.style.removeProperty('--staff-bar')
      html.style.removeProperty('scroll-padding-top')
      html.style.removeProperty('scroll-padding-bottom')
    }
  }, [])

  // Close it when the window becomes wide enough for the sidebar.
  useEffect(() => {
    const query = window.matchMedia(LG_QUERY)
    const onChange = () => {
      if (query.matches) setOpenOn(null)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Escape, a link, the Close button or the backdrop all end here.
  function handleClose() {
    setOpenOn(null)
    if (!window.matchMedia(LG_QUERY).matches) menuButtonRef.current?.focus()
  }

  function handleNavigate() {
    drawerLinkAt = Date.now()
    dialogRef.current?.close()
  }

  const navProps = { variant, active, onSelect, department, note, counts, locked }

  return (
    // break-words: with very large text, long words wrap instead of widening the page.
    <div ref={layoutRef} className="min-h-screen break-words bg-page font-body lg:flex">
      {/* The banner landmark on phones and tablets. From lg up it is hidden and the
          sidebar takes over, so there is only ever one banner. */}
      <header
        ref={topBarRef}
        className="top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-navy px-4 py-3 max-lg:[@media(min-height:30rem)]:sticky lg:hidden"
      >
        <div className="min-w-0">
          <Logo
            to={locked ? null : homePathFor(variant)}
            label={locked ? undefined : LOGO_LABELS[variant]}
          />
          <p className="font-body text-xs font-bold uppercase tracking-widest text-brand">
            {config.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {bell}
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            onClick={() => setOpenOn(location.key)}
            className="flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-full border border-mint/40 px-4 font-body text-sm font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none"
          >
            <MenuIcon />
            Menu
          </button>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id={MENU_ID}
        aria-label={config.label}
        onClose={handleClose}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close() // the backdrop
        }}
        className="motion-dialog motion-drawer m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-navy/60 lg:hidden"
      >
        <div className="motion-drawer-panel flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto bg-navy px-3.5 py-6">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="mb-4 min-h-11 self-end rounded-full border border-mint/40 px-4 font-body text-sm font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none"
          >
            Close menu
          </button>
          <StaffNav {...navProps} onNavigate={handleNavigate} />
        </div>
      </dialog>

      <aside aria-label="Staff menu" className="hidden w-[250px] shrink-0 flex-col overflow-y-auto bg-navy px-3.5 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <StaffNav {...navProps} bell={bell} />
      </aside>

      {/* Fields scrolled into view keep clear of the sticky action bars. */}
      <main
        className={clsx(
          'min-w-0 flex-1 [&_:is(a,button,input,select,textarea)]:scroll-mb-28',
          fit.screen,
        )}
      >
        {children}
      </main>
    </div>
  )
}
