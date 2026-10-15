import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { LOCKED_MESSAGE } from '../../services/api'
import ReportStatusPill from '../../components/ui/ReportStatusPill'
import MapIllustration from './MapIllustration'
import { CameraIcon, CloseIcon } from '../../components/ui/icons'

export default function ReportModal({ report, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const r = report
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-navy/55 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={r.title} className="relative max-h-[calc(100vh-32px)] w-[860px] max-w-full overflow-auto rounded-[26px] bg-mint p-6">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white">
          <CloseIcon />
        </button>

        <div className="mb-1.5 flex items-center gap-1.5">
          <ReportStatusPill status={r.status} />
          <span className="rounded-full border-[1.5px] border-navy px-[9px] text-xs font-bold">{r.category}</span>
        </div>
        <h2 className="max-w-[90%] font-heading text-[32px] font-extrabold leading-tight tracking-tight">{r.title}</h2>
        <p className="mt-1 text-[13px] text-muted">
          Reported on {r.dateLabel} · {r.upvotes} upvote{r.upvotes === 1 ? '' : 's'}
        </p>
        {/* The same rule as the card and the edit page (canEditIssue). */}
        {r.editState === 'ok' && (
          <Link
            to={`/issues/${r.id}/edit`}
            aria-label={`Edit report: ${r.title}`}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-navy px-5 text-sm font-bold text-navy transition-colors hover:bg-navy/10 motion-reduce:transition-none"
          >
            Edit report
          </Link>
        )}
        {r.editState === 'locked' && (
          <p className="mt-2 text-sm font-semibold text-navy">{LOCKED_MESSAGE}</p>
        )}

        <div className="mt-2 grid gap-5 md:grid-cols-2">
          <div>
            <div className="relative grid h-[220px] place-items-center rounded-[20px] bg-slate text-mint">
              {r.photoUrl ? (
                <img src={r.photoUrl} alt={`Photo of ${r.title}`} className="absolute inset-0 h-full w-full rounded-[20px] object-cover" />
              ) : (
                <span className="flex items-center gap-1.5"><CameraIcon size={20} />No photo added</span>
              )}
              <em className="absolute bottom-3 left-3 rounded-full bg-navy px-[11px] py-1.5 text-[11px] font-bold not-italic tracking-[.1em]">BEFORE</em>
            </div>
            <div className="relative mt-2.5 h-[150px] overflow-hidden rounded-[20px]">
              <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-bold">{r.location || 'Location not set'}</span>
              <MapIllustration pinClass="left-1/2 top-[60%] w-[26px]" />
            </div>
          </div>

          <div>
            <p className="leading-normal">{r.description || 'No description added.'}</p>

            <div className="mt-3.5 rounded-[18px] bg-white px-4 py-3.5">
              <h3 className="mb-2 font-heading text-lg font-extrabold tracking-tight">Status history</h3>
              {r.history.map(({ label, note }, i) => {
                const last = i === r.history.length - 1
                return (
                  <div key={label + i} className="relative flex gap-3 pb-3 last:pb-0">
                    {!last && <span className="absolute bottom-0 left-1.5 top-4 w-0.5 bg-mint-deep" aria-hidden="true" />}
                    <i className={clsx('mt-[3px] h-3.5 w-3.5 flex-none rounded-full', last ? 'bg-navy ring-[3px] ring-brand' : 'bg-forest')} />
                    <div>
                      <b className="block">{label}</b>
                      {note && <span className="text-[13px] text-muted">{note}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3.5 rounded-[18px] bg-white px-4 py-3.5">
              <h3 className="mb-2 font-heading text-lg font-extrabold tracking-tight">Department response</h3>
              <span className="text-muted">
                {r.department ? (
                  <><b className="text-navy">{r.department}</b> — {r.updateText}</>
                ) : (
                  'No response yet. You will be notified when a department picks this up.'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}