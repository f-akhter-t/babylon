import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { LOCKED_MESSAGE } from '../../services/api'
import ReportStatusPill from '../../components/ui/ReportStatusPill'
import StaticMap from '../../components/ui/StaticMap'
import { CameraIcon, CloseIcon } from '../../components/ui/icons'
import { cardTitleId } from './cardTitleId'
import { useT } from '../../i18n/useLanguage'

const actionClass =
  'inline-flex min-h-11 items-center rounded-full border-2 border-navy px-5 text-sm font-bold text-navy transition-colors hover:bg-navy/10 motion-reduce:transition-none'

// A report's details, on a native modal <dialog>: showModal() puts it in the
// top layer and makes the page behind inert, so Tab stays inside. It opens
// whenever ?report=<id> is in the address (a card click, or Back from the
// issue page). Focus starts on Close and goes back to that report's card;
// Tab wraps inside it.
// Escape, Close and a click on the dimmed backdrop all call onClose.
// open=false closes it at once (focus goes back to the card) while it fades
// out; the page removes it a moment later.
// deleted: the report was deleted in another tab while this was open. The
// details give way to a short message, which takes focus; Close stays.
export default function ReportModal({ report, open = true, deleted = false, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = useId()
  const id = report.id

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open) return
    if (!dialog.open) dialog.showModal()
    closeRef.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
      // Still on My reports: back to the card. If the card has gone (deleted),
      // to the list heading instead. After a move to another page, nothing.
      const card = document.getElementById(cardTitleId(id))
      if (card && !card.closest('[inert]')) card.focus()
      else document.getElementById('my-reports-heading')?.focus()
    }
  }, [id, open])

  const deletedRef = useRef(null)
  useEffect(() => {
    if (deleted) deletedRef.current?.focus()
  }, [deleted])

  // Tab and Shift+Tab wrap around inside the dialog, so focus never leaves it.
  function keepTabInside(event) {
    if (event.key !== 'Tab') return
    const items = [...dialogRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    const first = items[0]
    const last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const r = report
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Escape: close through the address, like the Close button
        onClose()
      }}
      // The dialog element itself is only hit on the backdrop: the content
      // fills it.
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={keepTabInside}
      className="motion-dialog m-auto max-h-[calc(100dvh-32px)] w-[860px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[26px] bg-mint p-0 text-navy backdrop:bg-navy/55"
    >
      <div className="relative max-h-[calc(100dvh-32px)] overflow-auto p-6">
        <button ref={closeRef} type="button" onClick={onClose} aria-label={t('Close')} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white">
          <CloseIcon />
        </button>

        {deleted ? (
          <div className="py-6 pr-12">
            <h2
              ref={deletedRef}
              id={titleId}
              tabIndex={-1}
              className="font-heading text-[32px] font-extrabold leading-tight tracking-tight focus:outline-none"
            >
              {t('This report was deleted.')}
            </h2>
            <p className="mt-2 text-muted">
              {t('It was deleted in another tab, so it is no longer on the map, in the feed or in your reports.')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-1.5 flex items-center gap-1.5">
              <ReportStatusPill status={r.status} />
              <span className="rounded-full border-[1.5px] border-navy px-[9px] text-xs font-bold">{t(r.category)}</span>
            </div>
            <h2 id={titleId} className="max-w-[90%] font-heading text-[32px] font-extrabold leading-tight tracking-tight">{r.title}</h2>
            <p className="mt-1 text-[13px] text-muted">
              {t('Reported on {date}', { date: r.dateLabel })} · {t('{n} upvotes', { n: r.upvotes })}
            </p>
            {/* The same rule as the card and the edit page (canEditIssue). */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={`/issues/${r.id}`}
                aria-label={t('Open issue page: {title}', { title: r.title })}
                className={actionClass}
              >
                {t('Open issue page')}
              </Link>
              {r.editState === 'ok' && (
                <Link
                  to={`/issues/${r.id}/edit`}
                  aria-label={t('Edit report: {title}', { title: r.title })}
                  className={actionClass}
                >
                  {t('Edit report')}
                </Link>
              )}
            </div>
            {r.editState === 'locked' && (
              <p className="mt-2 text-sm font-semibold text-navy">{t(LOCKED_MESSAGE)}</p>
            )}

            <div className="mt-2 grid gap-5 md:grid-cols-2">
              <div>
                <div className="relative grid h-[220px] place-items-center rounded-[20px] bg-slate text-mint">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={t('Photo of {title}', { title: r.title })} className="absolute inset-0 h-full w-full rounded-[20px] object-cover" />
                  ) : (
                    <span className="flex items-center gap-1.5"><CameraIcon size={20} />{t('No photo added')}</span>
                  )}
                  <em className="absolute bottom-3 left-3 rounded-full bg-navy px-[11px] py-1.5 text-[11px] font-bold not-italic tracking-[.1em]">{t('Before').toUpperCase()}</em>
                </div>
                <div className="relative mt-2.5 h-[150px] overflow-hidden rounded-[20px]">
                  <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-bold">{r.location || t('Location not set')}</span>
                  <StaticMap
                    lat={r.lat}
                    lng={r.lng}
                    status={r.mapStatus}
                    cover={{ width: 460, height: 150 }}
                    className="h-full w-full"
                  />
                </div>
                {/* The page's own credit is hidden behind the dialog. */}
                <p className="mt-1 text-right text-xs text-muted">{t('Map © OpenStreetMap contributors')}</p>
              </div>

              <div>
                <p className="leading-normal">{r.description || t('No description added.')}</p>

                <div className="mt-3.5 rounded-[18px] bg-white px-4 py-3.5">
                  <h3 className="mb-2 font-heading text-lg font-extrabold tracking-tight">{t('Status history')}</h3>
                  {r.history.map(({ label, note }, i) => {
                    const last = i === r.history.length - 1
                    return (
                      <div key={label + i} className="relative flex gap-3 pb-3 last:pb-0">
                        {!last && <span className="absolute bottom-0 left-1.5 top-4 w-0.5 bg-mint-deep" aria-hidden="true" />}
                        <i className={clsx('mt-[3px] h-3.5 w-3.5 flex-none rounded-full', last ? 'bg-navy ring-[3px] ring-brand' : 'bg-forest')} />
                        <div>
                          <b className="block">{t(label)}</b>
                          {note && <span className="text-[13px] text-muted">{t(note)}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3.5 rounded-[18px] bg-white px-4 py-3.5">
                  <h3 className="mb-2 font-heading text-lg font-extrabold tracking-tight">{t('Department response')}</h3>
                  <span className="text-muted">
                    {r.department ? (
                      <><b className="text-navy">{t(r.department)}</b> — {t(r.updateText)}</>
                    ) : (
                      t('No response yet. You will be notified when a department picks this up.')
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}