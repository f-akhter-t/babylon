import { useEffect, useRef } from 'react'
import { Popup } from 'react-leaflet'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDaysAgo } from '../../utils/format'
import PopupPhoto from './PopupPhoto'
import PopupActions from './PopupActions'
import { POPUP_CLASSES } from './popupStyles'
import { animate, RISE_IN, SPRING } from './motion'

// Shown only while an issue is selected. React decides when it is open,
// so the popup, the pin and the card always agree.
// Votes and follows live in Map.jsx, so the list updates too.
export default function MapPopup({ issue, viewer, onClose, onToggleVote, onToggleFollow }) {
  const contentRef = useRef(null)

  // Grow the white card in from just above the pin when it opens.
  useEffect(() => {
    const card = contentRef.current?.closest('.leaflet-popup-content-wrapper')
    animate(card, RISE_IN, { duration: 320, easing: SPRING })
  }, [])

  return (
    <Popup
      position={[issue.lat, issue.lng]}
      offset={[0, -44]} // sit above the selected pin, not on top of it
      minWidth={310}
      maxWidth={330}
      closeButton={false}
      closeOnClick={false}
      autoClose={false}
      autoPan={false}
      className={POPUP_CLASSES}
    >
      <div ref={contentRef} className="relative flex flex-col gap-3 p-4 font-body text-navy">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close (Esc)"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-lg leading-none text-muted hover:bg-mint hover:text-navy"
        >
          ×
        </button>

        <div className="flex gap-3 pr-6">
          <PopupPhoto issue={issue} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-heading text-base font-extrabold leading-tight">{issue.title}</h2>
            <span className="text-xs text-slate">
              {issue.category} · Reported {formatDaysAgo(issue.daysAgo)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill status={issue.status} className="px-2.5 py-0.5 text-xs" />
              <PriorityBadge priority={issue.priority} />
            </div>
          </div>
        </div>

        <PopupActions
          issue={issue}
          viewer={viewer}
          onToggleVote={onToggleVote}
          onToggleFollow={onToggleFollow}
        />
      </div>
    </Popup>
  )
}
