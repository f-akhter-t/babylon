import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowUpIcon, BarsIcon, BellIcon, CheckIcon, CloseIcon, ReopenIcon, UserIcon } from '../ui/icons'
import { useNotifications } from '../../hooks/useNotifications'
import { enter, usePresence } from '../ui/motion'
import { timeAgo } from '../../services/notifications'
import { useT } from '../../i18n/useLanguage'

// One icon and colour per kind of notice (services/notifications.js).
const KINDS = {
  welcome: { icon: <BellIcon size={18} />, style: 'bg-brand text-navy' },
  filed: { icon: <BarsIcon size={18} />, style: 'bg-brand text-navy' },
  'new-report': { icon: <BarsIcon size={18} />, style: 'bg-slate text-mint' },
  'in-progress': { icon: <BarsIcon size={18} />, style: 'bg-slate text-mint' },
  'fix-submitted': { icon: <BarsIcon size={18} />, style: 'bg-slate text-mint' },
  'fix-waiting': { icon: <BarsIcon size={18} />, style: 'bg-amber text-navy' },
  'fix-verified': { icon: <CheckIcon size={18} />, style: 'bg-brand text-navy' },
  resolved: { icon: <CheckIcon size={18} />, style: 'bg-brand text-navy' },
  'sent-back': { icon: <ReopenIcon size={18} />, style: 'bg-amber text-navy' },
  'identity-verified': { icon: <UserIcon size={18} />, style: 'bg-brand text-navy' },
  'identity-rejected': { icon: <UserIcon size={18} />, style: 'bg-amber text-navy' },
  'level-up': { icon: <ArrowUpIcon size={18} />, style: 'bg-amber text-navy' },
}
const FALLBACK = KINDS.welcome

const PANEL_WIDTH = 392
const EDGE = 12 // px kept free at the screen edges

// The bell and its panel, the same for citizens and staff (Navbar and the
// staff layout). The panel is drawn at the end of <body>, placed under the
// bell, so no sidebar or scrolling box can cut it off.
//   email: whose notices. homeLink, homeLabel: the link at the bottom of the panel.
export default function NotificationBell({ email, alertsPath = '/citizen/alerts', homeLink = '/my-reports', homeLabel = 'View my reports' }) {
  const t = useT()
  const { items, unread, markRead, markAllRead } = useNotifications(email, alertsPath)
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null) // { top, left, width, maxHeight }
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  // The panel keeps its place while it fades out; it is measured again on opening.
  const close = useCallback((returnFocus) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  // Under the bell, kept on screen. A bell in the left half (the staff
  // sidebar) opens to the right, its left edge in line with the bell; a bell in
  // the right half (the navbars) opens to the left, its right edge in line.
  // Phones: the full width.
  const measure = useCallback(() => {
    const r = buttonRef.current?.getBoundingClientRect()
    if (!r) return
    const vw = document.documentElement.clientWidth
    const width = Math.min(PANEL_WIDTH, vw - EDGE * 2)
    const wanted = r.left + r.width / 2 < vw / 2 ? r.left : r.right - width
    const left = vw < 640 ? EDGE : Math.min(Math.max(EDGE, wanted), vw - width - EDGE)
    const top = r.bottom + 10
    setPlace({ top, left, width, maxHeight: Math.max(160, window.innerHeight - top - EDGE) })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, measure])

  // Once the panel is on screen (it is drawn after it is measured), focus moves
  // into it; Escape or a click outside closes it.
  const shown = open && place !== null
  const panel = usePresence(shown)
  useEffect(() => {
    if (!shown) return
    panelRef.current?.focus()
    const inside = (target) => panelRef.current?.contains(target) || buttonRef.current?.contains(target)
    const onDown = (e) => { if (!inside(e.target)) close(false) }
    const onKey = (e) => { if (e.key === 'Escape') close(true) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [shown, close])

  // The panel sits at the end of the page, so Tab past its last control or
  // Shift+Tab before its first closes it and puts focus back on the bell.
  function onPanelKeyDown(e) {
    if (e.key !== 'Tab') return
    const controls = [...panelRef.current.querySelectorAll('a[href], button:not(:disabled)')]
    const first = controls[0]
    const last = controls.at(-1)
    const atStart = document.activeElement === first || document.activeElement === panelRef.current
    if ((e.shiftKey && atStart) || (!e.shiftKey && document.activeElement === last)) {
      e.preventDefault()
      close(true)
    }
  }

  // Focus moving anywhere else (a click outside) closes it too.
  function onPanelBlur(e) {
    if (e.relatedTarget && !panelRef.current?.contains(e.relatedTarget) && !buttonRef.current?.contains(e.relatedTarget)) close(false)
  }

  const label = unread
    ? t('Notifications, {n} unread.', { n: unread })
    : t('Notifications, none unread.')

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          'relative grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-mint/20 text-mint transition-colors hover:bg-mint/10',
          open && 'bg-mint/10',
        )}
      >
        <BellIcon />
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-navy bg-amber px-1 text-[11px] font-extrabold text-navy">
            {unread}
          </span>
        )}
      </button>

      {panel.mounted && place && createPortal(
        <section
          ref={panelRef}
          role="dialog"
          aria-label={t('Notifications')}
          tabIndex={-1}
          inert={panel.closing}
          aria-hidden={panel.closing || undefined}
          onBlur={onPanelBlur}
          onKeyDown={onPanelKeyDown}
          style={{
            top: place.top,
            left: place.left,
            width: place.width,
            maxHeight: place.maxHeight,
            ...(panel.closing
              ? enter('fade-out', 0, 'var(--duration-fast)')
              : enter('rise-in', 0, 'var(--duration-base)')),
          }}
          className={clsx(
            'fixed z-[1300] flex flex-col overflow-hidden rounded-[20px] bg-white font-body text-navy shadow-xl focus:outline-none',
            panel.closing && 'pointer-events-none',
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate/15 bg-white px-[18px] pb-3 pt-4">
            <h2 className="font-heading text-xl font-extrabold tracking-tight">{t('Notifications')}</h2>
            <span className="rounded-full bg-amber px-[9px] py-0.5 text-xs font-extrabold">
              {unread ? t('{n} new', { n: unread }) : t('All caught up')}
            </span>
            <span className="flex-1" />
            {unread > 0 && (
              <button type="button" onClick={() => markAllRead()} className="-my-2 min-h-11 px-1 text-sm font-bold text-forest underline underline-offset-[3px]">
                {t('Mark all as read')}
              </button>
            )}
            <button type="button" onClick={() => close(true)} aria-label={t('Close notifications')} className="-my-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-mint">
              <CloseIcon />
            </button>
          </div>

          <ul className="flex min-h-0 flex-col gap-1.5 overflow-auto p-2">
            {items.length === 0 && (
              <li className="px-5 py-9 text-center text-muted">
                <b className="text-navy">{t('No notifications yet.')}</b>
                <br />
                {t('Updates about your reports and your work will show up here.')}
              </li>
            )}
            {items.map((n) => {
              const kind = KINDS[n.kind] ?? FALLBACK
              return (
                <li key={n.id}>
                  <Link
                    to={n.link || homeLink}
                    onClick={() => { markRead(n.id); close(false) }}
                    className={clsx(
                      'relative flex w-full gap-3 rounded-[14px] p-3 text-left transition-colors',
                      n.read ? 'bg-white hover:bg-mint/60' : 'bg-mint hover:bg-mint-deep/60',
                    )}
                  >
                    <span aria-hidden="true" className={clsx('grid size-9 flex-none place-items-center rounded-full', kind.style)}>
                      {kind.icon}
                    </span>
                    <span className="block pr-3.5">
                      <span className="block text-sm font-semibold leading-snug">{n.text}</span>
                      <small className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</small>
                    </span>
                    {!n.read && (
                      <>
                        <span aria-hidden="true" className="absolute right-3 top-3.5 size-2 rounded-full bg-forest" />
                        <span className="sr-only">{t('Unread.')}</span>
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="shrink-0 border-t border-slate/15 px-[18px] pb-3.5 pt-2.5 text-center">
            <Link to={homeLink} onClick={() => close(false)} className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-forest underline underline-offset-[3px]">
              {t(homeLabel)}
            </Link>
          </div>
        </section>,
        document.body,
      )}
    </>
  )
}
