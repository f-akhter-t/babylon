import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BellIcon, BarsIcon, ArrowUpIcon, UserIcon, CloseIcon } from '../ui/icons'
import {
  useNotifications, markNotificationRead, markAllNotificationsRead, timeAgo,
} from '../../services/reportsStore'

const KIND = {
  dep: { icon: <BarsIcon size={18} />, style: 'bg-slate text-mint' },
  up:  { icon: <ArrowUpIcon size={18} />, style: 'bg-amber text-navy' },
  acc: { icon: <UserIcon size={18} />, style: 'bg-brand text-navy' },
}

// reportsPath = the route where the My reports page lives
export default function NotificationBell({ reportsPath = '/my-reports' }) {
  const [open, setOpen] = useState(false)
  const items = useNotifications()
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const unread = items.filter((n) => n.unread).length

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

  const openItem = (n) => {
    markNotificationRead(n.id)
    if (n.reportId) {
      setOpen(false)
      navigate(`${reportsPath}?report=${n.reportId}`)
    }
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
          'relative grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-mint/20 text-mint transition-colors',
          'hover:bg-mint/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          open && 'bg-mint/10'
        )}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-navy bg-amber px-1 text-[11px] font-extrabold text-navy">
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
              <button type="button" onClick={markAllNotificationsRead} className="-my-2 min-h-11 px-1 text-sm font-bold text-forest underline underline-offset-[3px]">
                Mark all as read
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-my-2 -mr-2 grid size-11 place-items-center rounded-full hover:bg-mint">
              <CloseIcon />
            </button>
          </div>

          <div className="flex max-h-[380px] flex-col gap-1.5 overflow-auto p-2">
            {items.length === 0 && (
              <div className="px-5 py-9 text-center text-muted">
                <b className="text-navy">No notifications yet</b>
                <br />
                Status updates and upvotes on your reports will show up here.
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={clsx(
                  'relative flex w-full gap-3 rounded-[14px] p-3 text-left transition-colors',
                  n.unread ? 'bg-mint hover:bg-mint-deep/60' : 'bg-white hover:bg-mint/60'
                )}
              >
                <span className={clsx('grid h-9 w-9 flex-none place-items-center rounded-full', KIND[n.kind].style)}>
                  {KIND[n.kind].icon}
                </span>
                <span className="block pr-3.5">
                  <b className="block text-sm">{n.title}</b>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.body}</span>
                  <small className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</small>
                </span>
                {n.unread && <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-forest" aria-label="Unread" />}
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
