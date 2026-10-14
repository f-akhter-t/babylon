import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BarsIcon, ArrowUpIcon, BellIcon, CheckIcon, CloseIcon, PinIcon, ReopenIcon } from '../ui/icons'
import { getAlerts, markAlertsSeen, ISSUES_EVENT } from '../../services/api'

// alert.type from getAlerts(): status | resolved | nearby | reopened | upvote
const KIND = {
  status:   { icon: <BarsIcon size={18} />,    style: 'bg-slate text-mint' },
  resolved: { icon: <CheckIcon size={18} />,   style: 'bg-forest text-mint' },
  nearby:   { icon: <PinIcon size={18} />,     style: 'bg-amber text-navy' },
  reopened: { icon: <ReopenIcon size={18} />,  style: 'bg-amber text-navy' },
  upvote:   { icon: <ArrowUpIcon size={18} />, style: 'bg-amber text-navy' },
}

// email = the logged-in citizen (session.email). reportsPath = where My reports lives.
export default function NotificationBell({ email, reportsPath = '/my-reports' }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const unread = items.filter((a) => a.unread).length

  // reload when a report is created or upvoted, and once a minute so "2 min ago" stays fresh
  useEffect(() => {
    let active = true
    const load = () =>
      Promise.resolve(getAlerts('All', email)).then((list) => {
        if (active) setItems(list)
      })
    load()
    window.addEventListener(ISSUES_EVENT, load)
    const timer = setInterval(load, 60000)
    return () => {
      active = false
      window.removeEventListener(ISSUES_EVENT, load)
      clearInterval(timer)
    }
  }, [email])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openItem = (a) => {
    markAlertsSeen(email, [a])
    setOpen(false)
    // nearby alerts point at someone else's issue, the rest at the citizen's own report
    navigate(a.group === 'nearby' ? `/issues/${a.issueId}` : `${reportsPath}?report=${a.issueId}`)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        className={clsx(
          'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          open && 'bg-white/10'
        )}
      >
        <BellIcon size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber text-xs font-bold text-navy">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-[-60px] top-14 z-50 w-[392px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[20px] bg-white font-body text-navy shadow-pop max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[68px] max-sm:w-auto"
        >
          <span aria-hidden="true" className="absolute -top-[6px] right-[76px] h-3.5 w-3.5 rotate-45 rounded-[3px] bg-white max-sm:hidden" />

          <div className="relative flex items-center gap-2 border-b border-slate/15 bg-white px-[18px] pb-3 pt-4">
            <h3 className="font-heading text-xl font-extrabold tracking-tight">Notifications</h3>
            <span className="rounded-full bg-amber px-[9px] py-0.5 text-xs font-extrabold">
              {unread ? `${unread} new` : 'All caught up'}
            </span>
            <span className="flex-1" />
            {unread > 0 && (
              <button type="button" onClick={() => markAlertsSeen(email, items)} className="p-1 text-sm font-bold text-forest underline underline-offset-[3px]">
                Mark all as read
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-full hover:bg-mint">
              <CloseIcon />
            </button>
          </div>

          <div className="flex max-h-[380px] flex-col gap-1.5 overflow-auto p-2">
            {items.length === 0 && (
              <div className="px-5 py-9 text-center text-muted">
                <b className="text-navy">{email ? 'No notifications yet' : 'Log in to see notifications'}</b>
                <br />
                Status updates and upvotes on your reports will show up here.
              </div>
            )}
            {items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openItem(a)}
                className={clsx(
                  'relative flex w-full gap-3 rounded-[14px] p-3 text-left transition-colors',
                  a.unread ? 'bg-mint hover:bg-mint-deep/60' : 'bg-white hover:bg-mint/60'
                )}
              >
                <span className={clsx('grid h-9 w-9 flex-none place-items-center rounded-full', (KIND[a.type] ?? KIND.status).style)}>
                  {(KIND[a.type] ?? KIND.status).icon}
                </span>
                <span className="block pr-3.5">
                  <b className="block text-sm">{a.title}</b>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{a.message}</span>
                  <small className="mt-1 block text-xs text-muted">{a.time}</small>
                </span>
                {a.unread && <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-forest" aria-label="Unread" />}
              </button>
            ))}
          </div>

          <div className="border-t border-slate/15 px-[18px] pb-3.5 pt-2.5 text-center">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate(reportsPath) }}
              className="p-1 text-sm font-bold text-forest underline underline-offset-[3px]"
            >
              View my reports
            </button>
          </div>
        </section>
      )}
    </div>
  )
}