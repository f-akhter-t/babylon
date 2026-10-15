import clsx from 'clsx'
import ReportStatusPill from '../../components/ui/ReportStatusPill'
import MapIllustration from './MapIllustration'
import { ArrowUpIcon, CameraIcon, PinIcon } from '../../components/ui/icons'

export default function ReportCard({ report, onOpen }) {
  const r = report
  return (
    <button
      type="button"
      onClick={() => onOpen(r.id)}
      className={clsx(
        'flex h-full w-full flex-col overflow-hidden rounded-card bg-mint text-left transition duration-150',
        'hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'
      )}
    >
      {/* grid-rows-1: the row is exactly the 150px strip, so a tall photo is
          cropped instead of growing under the text. */}
      <div className="grid h-[150px] grid-cols-[1.5fr_1fr] grid-rows-1 gap-0.5 bg-page">
        {r.photoUrl ? (
          <img src={r.photoUrl} alt={`Photo of ${r.title}`} className="h-full min-h-0 w-full object-cover" />
        ) : (
          <div className="grid place-items-center bg-slate text-xs text-mint">
            <span className="flex items-center gap-1.5"><CameraIcon />No photo added</span>
          </div>
        )}
        <MapIllustration />
      </div>

      {/* The card's own mint surface, opaque, so the text never sits on the photo or map. */}
      <div className="relative flex flex-1 flex-col gap-2 bg-mint px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <ReportStatusPill status={r.status} />
          <span className="text-[13px] text-muted">{r.dateLabel}</span>
        </div>
        <h3 className="font-heading text-[19px] font-extrabold leading-[1.15] tracking-tight">{r.title}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <PinIcon size={15} />
          {r.location || 'Location not set'}
          <span className="rounded-full border-[1.5px] border-navy px-[9px] text-xs font-bold text-navy">{r.category}</span>
        </div>

        <div className="border-t border-mint-deep pt-2 text-[13px] text-muted">
          {r.department ? (
            <>
              <b className="text-navy">{r.department}</b>
              <br />
              {r.updateText}
            </>
          ) : (
            'Not yet assigned to a department'
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-navy px-[13px] py-[5px] font-bold">
            <ArrowUpIcon size={13} /> {r.upvotes}
          </span>
          <span className="font-bold text-forest underline underline-offset-[3px]">View details</span>
        </div>
      </div>
    </button>
  )
}